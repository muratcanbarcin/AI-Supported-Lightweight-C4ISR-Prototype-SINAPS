#!/usr/bin/env python3
"""
================================================================================
        C4ISR TACTICAL AI - GEMMA-2-9B QLORA FINE-TUNING SCRIPT
================================================================================
    ███████╗██╗███╗   ██╗ █████╗ ██████╗ ███████╗
    ██╔════╝██║████╗  ██║██╔══██╗██╔══██╗██╔════╝
    ███████╗██║██╔██╗ ██║███████║██████╔╝███████╗
    ╚════██║██║██║╚██╗██║██╔══██║██╔═══╝ ╚════██║
    ███████║██║██║ ╚████║██║  ██║██║     ███████║
    ╚══════╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝     ╚══════╝

    QLORA FINE-TUNING FOR TACTICAL DECISION SUPPORT
    
    Model: Gemma-2-9b-it (4-bit quantized via bitsandbytes)
    Method: QLoRA (Quantized Low-Rank Adaptation)
    Dataset: Alpaca-format tactical telemetry analysis
    
    Requirements:
    - transformers >= 4.36.0
    - peft >= 0.7.0
    - bitsandbytes >= 0.41.0
    - trl >= 0.7.0
    - torch >= 2.0.0
    - datasets
    - accelerate
    
    Hardware: RTX 3080 16GB or equivalent
    
================================================================================
"""

import os
import sys
import json
import logging
import argparse
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any

import torch
from datasets import load_dataset, Dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    set_seed,
)
from peft import (
    LoraConfig,
    get_peft_model,
    prepare_model_for_kbit_training,
    TaskType,
)
from trl import SFTTrainer, SFTConfig

# ============================================================================
#                           CONFIGURATION
# ============================================================================

# Default paths (relative to ai-service directory)
DEFAULT_MODEL_PATH = "./local_models/llm"
DEFAULT_DATASET_PATH = "../simulators/sim-producers/real_world_train_data.jsonl"
DEFAULT_OUTPUT_DIR = "./fine_tuned_adapter"
DEFAULT_LOGS_DIR = "./training_logs"

# Training hyperparameters
TRAINING_CONFIG = {
    # Batch and accumulation (effective batch = 1 * 4 = 4)
    "per_device_train_batch_size": 1,
    "gradient_accumulation_steps": 4,
    
    # Training steps
    "max_steps": 500,
    "warmup_steps": 50,
    "save_steps": 100,
    "logging_steps": 10,
    "eval_steps": 100,
    
    # Optimizer settings
    "learning_rate": 2e-4,
    "weight_decay": 0.01,
    "max_grad_norm": 0.3,
    
    # Precision - Use bf16 on Ampere+ GPUs (RTX 30xx, 40xx)
    "fp16": False,
    "bf16": True,  # BFloat16 for Ampere+ GPUs
    
    # Memory optimization
    "gradient_checkpointing": True,
    "optim": "paged_adamw_32bit",
    
    # Sequence length
    "max_seq_length": 2048,
}

# LoRA configuration
LORA_CONFIG = {
    "r": 64,                    # Rank - higher = more capacity but more memory
    "lora_alpha": 16,           # Scaling factor
    "lora_dropout": 0.1,        # Dropout for regularization
    "bias": "none",             # Don't train biases
    "task_type": TaskType.CAUSAL_LM,
    
    # Target modules for Gemma-2 (attention layers)
    "target_modules": [
        "q_proj",   # Query projection
        "k_proj",   # Key projection
        "v_proj",   # Value projection
        "o_proj",   # Output projection
    ],
}

# 4-bit quantization config (NF4 for better quality)
QUANTIZATION_CONFIG = {
    "load_in_4bit": True,
    "bnb_4bit_quant_type": "nf4",           # NormalFloat4 - better than FP4
    "bnb_4bit_compute_dtype": torch.float16, # Compute in FP16
    "bnb_4bit_use_double_quant": True,       # Nested quantization for memory savings
}

# ============================================================================
#                           LOGGING SETUP
# ============================================================================

def setup_logging(log_dir: str = DEFAULT_LOGS_DIR) -> logging.Logger:
    """Configure logging for training."""
    Path(log_dir).mkdir(parents=True, exist_ok=True)
    
    log_file = Path(log_dir) / f"train_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
    
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(log_file, encoding="utf-8"),
        ],
    )
    
    logger = logging.getLogger(__name__)
    logger.info(f"Logging to: {log_file}")
    return logger


# ============================================================================
#                           PROMPT FORMATTING
# ============================================================================

# Alpaca-style prompt template
ALPACA_TEMPLATE = """Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
{instruction}

### Input:
{input}

### Response:
{output}"""

ALPACA_TEMPLATE_NO_INPUT = """Below is an instruction that describes a task. Write a response that appropriately completes the request.

### Instruction:
{instruction}

### Response:
{output}"""


def formatting_prompts_func(examples: Dict[str, List[str]]) -> List[str]:
    """
    Format dataset examples into Alpaca-style training prompts.
    
    This function handles batched inputs from the dataset and converts them
    into properly formatted prompts for instruction-following fine-tuning.
    
    Args:
        examples: Dictionary with 'instruction', 'input', and 'output' keys
        
    Returns:
        List of formatted prompt strings
    """
    output_texts = []
    
    for i in range(len(examples["instruction"])):
        instruction = examples["instruction"][i]
        input_text = examples.get("input", [""] * len(examples["instruction"]))[i]
        output = examples["output"][i]
        
        # Choose template based on whether input is present
        if input_text and input_text.strip():
            text = ALPACA_TEMPLATE.format(
                instruction=instruction,
                input=input_text,
                output=output
            )
        else:
            text = ALPACA_TEMPLATE_NO_INPUT.format(
                instruction=instruction,
                output=output
            )
        
        output_texts.append(text)
    
    return output_texts


def format_single_example(example: Dict[str, str]) -> str:
    """Format a single example for inference."""
    instruction = example.get("instruction", "")
    input_text = example.get("input", "")
    
    if input_text and input_text.strip():
        return ALPACA_TEMPLATE.format(
            instruction=instruction,
            input=input_text,
            output=""  # Empty for inference
        ).rsplit("### Response:\n", 1)[0] + "### Response:\n"
    else:
        return ALPACA_TEMPLATE_NO_INPUT.format(
            instruction=instruction,
            output=""
        ).rsplit("### Response:\n", 1)[0] + "### Response:\n"


# ============================================================================
#                           DATA LOADING
# ============================================================================

def load_training_data(
    dataset_path: str,
    validation_split: float = 0.05,
    seed: int = 42
) -> tuple:
    """
    Load and prepare the training dataset.
    
    Args:
        dataset_path: Path to the JSONL dataset file
        validation_split: Fraction of data to use for validation
        seed: Random seed for reproducibility
        
    Returns:
        Tuple of (train_dataset, eval_dataset)
    """
    logger = logging.getLogger(__name__)
    
    logger.info(f"Loading dataset from: {dataset_path}")
    
    # Load the JSONL dataset
    dataset = load_dataset("json", data_files=dataset_path, split="train")
    
    logger.info(f"Loaded {len(dataset)} examples")
    
    # Log sample
    if len(dataset) > 0:
        sample = dataset[0]
        logger.info(f"Sample keys: {list(sample.keys())}")
        logger.info(f"Sample instruction (first 100 chars): {sample.get('instruction', '')[:100]}...")
    
    # Split into train/eval
    if validation_split > 0:
        split = dataset.train_test_split(test_size=validation_split, seed=seed)
        train_dataset = split["train"]
        eval_dataset = split["test"]
        logger.info(f"Split: {len(train_dataset)} training, {len(eval_dataset)} validation")
    else:
        train_dataset = dataset
        eval_dataset = None
        logger.info(f"No validation split, using all {len(train_dataset)} examples for training")
    
    return train_dataset, eval_dataset


# ============================================================================
#                           MODEL LOADING
# ============================================================================

def load_model_and_tokenizer(
    model_path: str,
    use_flash_attention: bool = False,
) -> tuple:
    """
    Load the base model with 4-bit quantization and tokenizer.
    
    Args:
        model_path: Path to the local model or HuggingFace model ID
        use_flash_attention: Whether to use Flash Attention 2
        
    Returns:
        Tuple of (model, tokenizer)
    """
    logger = logging.getLogger(__name__)
    
    logger.info(f"Loading model from: {model_path}")
    
    # Configure quantization
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=QUANTIZATION_CONFIG["load_in_4bit"],
        bnb_4bit_quant_type=QUANTIZATION_CONFIG["bnb_4bit_quant_type"],
        bnb_4bit_compute_dtype=QUANTIZATION_CONFIG["bnb_4bit_compute_dtype"],
        bnb_4bit_use_double_quant=QUANTIZATION_CONFIG["bnb_4bit_use_double_quant"],
    )
    
    # Model loading kwargs
    model_kwargs = {
        "quantization_config": bnb_config,
        "device_map": "auto",
        "trust_remote_code": True,
        "torch_dtype": torch.float16,
    }
    
    # Add Flash Attention if requested and available
    if use_flash_attention:
        try:
            model_kwargs["attn_implementation"] = "flash_attention_2"
            logger.info("Using Flash Attention 2")
        except Exception as e:
            logger.warning(f"Flash Attention not available: {e}")
    
    # Load model
    logger.info("Loading model with 4-bit quantization (this may take a few minutes)...")
    model = AutoModelForCausalLM.from_pretrained(model_path, **model_kwargs)
    
    # Log model info
    logger.info(f"Model loaded: {model.config.name_or_path}")
    logger.info(f"Model dtype: {model.dtype}")
    
    # Count parameters
    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    logger.info(f"Total parameters: {total_params:,}")
    logger.info(f"Trainable parameters (before LoRA): {trainable_params:,}")
    
    # Load tokenizer
    logger.info("Loading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(
        model_path,
        trust_remote_code=True,
        padding_side="right",  # Important for training
    )
    
    # Set pad token if not set
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
        logger.info(f"Set pad_token to eos_token: {tokenizer.pad_token}")
    
    logger.info(f"Tokenizer loaded. Vocab size: {tokenizer.vocab_size}")
    
    return model, tokenizer


def setup_lora(model) -> Any:
    """
    Configure and apply LoRA to the model.
    
    Args:
        model: The base model
        
    Returns:
        Model with LoRA adapters applied
    """
    logger = logging.getLogger(__name__)
    
    logger.info("Configuring LoRA...")
    logger.info(f"  Rank (r): {LORA_CONFIG['r']}")
    logger.info(f"  Alpha: {LORA_CONFIG['lora_alpha']}")
    logger.info(f"  Target modules: {LORA_CONFIG['target_modules']}")
    logger.info(f"  Dropout: {LORA_CONFIG['lora_dropout']}")
    
    # Prepare model for k-bit training
    model = prepare_model_for_kbit_training(
        model,
        use_gradient_checkpointing=TRAINING_CONFIG["gradient_checkpointing"]
    )
    
    # Create LoRA config
    lora_config = LoraConfig(
        r=LORA_CONFIG["r"],
        lora_alpha=LORA_CONFIG["lora_alpha"],
        target_modules=LORA_CONFIG["target_modules"],
        lora_dropout=LORA_CONFIG["lora_dropout"],
        bias=LORA_CONFIG["bias"],
        task_type=LORA_CONFIG["task_type"],
    )
    
    # Apply LoRA
    model = get_peft_model(model, lora_config)
    
    # Log trainable parameters after LoRA
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total_params = sum(p.numel() for p in model.parameters())
    trainable_pct = 100 * trainable_params / total_params
    
    logger.info(f"LoRA applied!")
    logger.info(f"  Trainable parameters: {trainable_params:,} ({trainable_pct:.2f}%)")
    logger.info(f"  Total parameters: {total_params:,}")
    
    model.print_trainable_parameters()
    
    return model


# ============================================================================
#                           TRAINING
# ============================================================================

def create_trainer(
    model,
    tokenizer,
    train_dataset: Dataset,
    eval_dataset: Optional[Dataset] = None,
    output_dir: str = DEFAULT_OUTPUT_DIR,
    resume_from_checkpoint: Optional[str] = None,
) -> SFTTrainer:
    """
    Create and configure the SFTTrainer.
    
    Args:
        model: The PEFT model with LoRA
        tokenizer: The tokenizer
        train_dataset: Training dataset
        eval_dataset: Optional validation dataset
        output_dir: Directory for saving checkpoints
        resume_from_checkpoint: Path to resume from
        
    Returns:
        Configured SFTTrainer
    """
    logger = logging.getLogger(__name__)
    
    logger.info("Configuring trainer...")
    
    # SFTConfig for TRL 0.27+
    sft_config = SFTConfig(
        output_dir=output_dir,
        
        # Batch settings
        per_device_train_batch_size=TRAINING_CONFIG["per_device_train_batch_size"],
        gradient_accumulation_steps=TRAINING_CONFIG["gradient_accumulation_steps"],
        
        # Training duration
        max_steps=TRAINING_CONFIG["max_steps"],
        warmup_steps=TRAINING_CONFIG["warmup_steps"],
        
        # Optimizer
        learning_rate=TRAINING_CONFIG["learning_rate"],
        weight_decay=TRAINING_CONFIG["weight_decay"],
        max_grad_norm=TRAINING_CONFIG["max_grad_norm"],
        optim=TRAINING_CONFIG["optim"],
        
        # Precision
        fp16=TRAINING_CONFIG["fp16"],
        bf16=TRAINING_CONFIG["bf16"],
        
        # Checkpointing
        save_steps=TRAINING_CONFIG["save_steps"],
        save_total_limit=3,
        
        # Logging
        logging_steps=TRAINING_CONFIG["logging_steps"],
        logging_dir=f"{output_dir}/logs",
        report_to=["tensorboard"],
        
        # Evaluation
        eval_strategy="steps" if eval_dataset is not None else "no",
        eval_steps=TRAINING_CONFIG["eval_steps"] if eval_dataset is not None else None,
        
        # Memory optimization
        gradient_checkpointing=TRAINING_CONFIG["gradient_checkpointing"],
        
        # Misc
        seed=42,
        push_to_hub=False,
    )
    
    logger.info(f"Training arguments configured:")
    logger.info(f"  Effective batch size: {sft_config.per_device_train_batch_size * sft_config.gradient_accumulation_steps}")
    logger.info(f"  Max steps: {sft_config.max_steps}")
    logger.info(f"  Learning rate: {sft_config.learning_rate}")
    logger.info(f"  FP16: {sft_config.fp16}")
    
    # Pre-format the dataset
    def format_dataset(examples):
        """Format examples and add 'text' field."""
        texts = formatting_prompts_func(examples)
        return {"text": texts}
    
    # Apply formatting to datasets
    formatted_train = train_dataset.map(
        format_dataset, 
        batched=True, 
        remove_columns=train_dataset.column_names
    )
    
    formatted_eval = None
    if eval_dataset is not None:
        formatted_eval = eval_dataset.map(
            format_dataset,
            batched=True,
            remove_columns=eval_dataset.column_names
        )
    
    # Create trainer
    trainer = SFTTrainer(
        model=model,
        processing_class=tokenizer,
        train_dataset=formatted_train,
        eval_dataset=formatted_eval,
        args=sft_config,
    )
    
    logger.info("Trainer created successfully!")
    
    return trainer


def train(
    model_path: str = DEFAULT_MODEL_PATH,
    dataset_path: str = DEFAULT_DATASET_PATH,
    output_dir: str = DEFAULT_OUTPUT_DIR,
    resume_from: Optional[str] = None,
    use_flash_attention: bool = False,
    seed: int = 42,
) -> str:
    """
    Run the complete fine-tuning pipeline.
    
    Args:
        model_path: Path to base model
        dataset_path: Path to training data
        output_dir: Directory for outputs
        resume_from: Checkpoint to resume from
        use_flash_attention: Use Flash Attention 2
        seed: Random seed
        
    Returns:
        Path to saved adapter
    """
    logger = logging.getLogger(__name__)
    
    # Set seed for reproducibility
    set_seed(seed)
    
    # Print GPU info
    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
        logger.info(f"GPU: {gpu_name} ({gpu_memory:.1f} GB)")
    else:
        logger.warning("No GPU available! Training will be very slow.")
    
    # Create output directory
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    # Save training config
    config_path = Path(output_dir) / "training_config.json"
    with open(config_path, "w") as f:
        json.dump({
            "training_config": TRAINING_CONFIG,
            "lora_config": {k: str(v) for k, v in LORA_CONFIG.items()},
            "quantization_config": {k: str(v) for k, v in QUANTIZATION_CONFIG.items()},
            "model_path": model_path,
            "dataset_path": dataset_path,
            "timestamp": datetime.now().isoformat(),
        }, f, indent=2)
    logger.info(f"Config saved to: {config_path}")
    
    # Load data
    train_dataset, eval_dataset = load_training_data(dataset_path, validation_split=0.05, seed=seed)
    
    # Load model
    model, tokenizer = load_model_and_tokenizer(model_path, use_flash_attention)
    
    # Apply LoRA
    model = setup_lora(model)
    
    # Create trainer
    trainer = create_trainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
        output_dir=output_dir,
        resume_from_checkpoint=resume_from,
    )
    
    # Train!
    logger.info("=" * 70)
    logger.info("  STARTING TRAINING")
    logger.info("=" * 70)
    
    training_start = datetime.now()
    
    try:
        trainer.train(resume_from_checkpoint=resume_from)
    except KeyboardInterrupt:
        logger.warning("Training interrupted! Saving checkpoint...")
        trainer.save_model(f"{output_dir}/interrupted_checkpoint")
        raise
    
    training_end = datetime.now()
    training_duration = training_end - training_start
    
    logger.info("=" * 70)
    logger.info("  TRAINING COMPLETE!")
    logger.info("=" * 70)
    logger.info(f"Duration: {training_duration}")
    
    # Save the final adapter
    final_adapter_path = Path(output_dir) / "final_adapter"
    logger.info(f"Saving final adapter to: {final_adapter_path}")
    
    model.save_pretrained(final_adapter_path)
    tokenizer.save_pretrained(final_adapter_path)
    
    logger.info("✅ Fine-tuning complete!")
    logger.info(f"  Adapter saved to: {final_adapter_path}")
    
    return str(final_adapter_path)


# ============================================================================
#                           CLI INTERFACE
# ============================================================================

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Fine-tune Gemma-2-9b-it with QLoRA for C4ISR tactical analysis",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic training with defaults
  python train.py
  
  # Custom paths
  python train.py --model ./my_model --dataset ./my_data.jsonl
  
  # Resume from checkpoint
  python train.py --resume ./fine_tuned_adapter/checkpoint-200
  
  # More training steps
  python train.py --max-steps 1000
        """
    )
    
    parser.add_argument(
        "--model", "-m",
        type=str,
        default=DEFAULT_MODEL_PATH,
        help=f"Path to base model (default: {DEFAULT_MODEL_PATH})"
    )
    parser.add_argument(
        "--dataset", "-d",
        type=str,
        default=DEFAULT_DATASET_PATH,
        help=f"Path to training dataset (default: {DEFAULT_DATASET_PATH})"
    )
    parser.add_argument(
        "--output", "-o",
        type=str,
        default=DEFAULT_OUTPUT_DIR,
        help=f"Output directory (default: {DEFAULT_OUTPUT_DIR})"
    )
    parser.add_argument(
        "--resume",
        type=str,
        default=None,
        help="Resume training from checkpoint"
    )
    parser.add_argument(
        "--max-steps",
        type=int,
        default=None,
        help="Override max training steps"
    )
    parser.add_argument(
        "--learning-rate",
        type=float,
        default=None,
        help="Override learning rate"
    )
    parser.add_argument(
        "--flash-attention",
        action="store_true",
        help="Use Flash Attention 2 (requires compatible GPU)"
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed (default: 42)"
    )
    
    return parser.parse_args()


def main():
    """Main entry point."""
    args = parse_args()
    
    # Setup logging
    logger = setup_logging()
    
    logger.info("=" * 70)
    logger.info("  C4ISR TACTICAL AI - QLORA FINE-TUNING")
    logger.info("=" * 70)
    
    # Override config if specified
    if args.max_steps:
        TRAINING_CONFIG["max_steps"] = args.max_steps
        logger.info(f"Overriding max_steps to: {args.max_steps}")
    
    if args.learning_rate:
        TRAINING_CONFIG["learning_rate"] = args.learning_rate
        logger.info(f"Overriding learning_rate to: {args.learning_rate}")
    
    try:
        adapter_path = train(
            model_path=args.model,
            dataset_path=args.dataset,
            output_dir=args.output,
            resume_from=args.resume,
            use_flash_attention=args.flash_attention,
            seed=args.seed,
        )
        
        print("\n" + "=" * 70)
        print("  ✅ FINE-TUNING SUCCESSFUL!")
        print("=" * 70)
        print(f"  Adapter saved to: {adapter_path}")
        print("\n  To use the adapter, load it with:\n")
        print("  from peft import PeftModel")
        print(f"  model = PeftModel.from_pretrained(base_model, '{adapter_path}')")
        print("=" * 70)
        
        return 0
        
    except KeyboardInterrupt:
        logger.warning("Training interrupted by user")
        return 1
    except Exception as e:
        logger.error(f"Training failed: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
