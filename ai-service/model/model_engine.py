"""
============================================================================
    C4ISR MODEL ENGINE - CONTEXT-AWARE TACTICAL AI BRAIN
============================================================================
    SECURITY: OFFLINE MODE - Model loaded from local directory only.
              No external network calls to HuggingFace or any API permitted.
============================================================================
    MODEL: Google Gemma-2-9b-it (9 billion parameters)
    HARDWARE TARGET: NVIDIA RTX 3080 (16GB VRAM) / 32GB System RAM
    QUANTIZATION: 4-bit NF4 (~6-7GB VRAM footprint)
    OPTIMIZATION: Full GPU residency, NO CPU offload for maximum speed
============================================================================
    KEY FEATURES:
    - Polymorphic telemetry handling via Pydantic model serialization
    - Context-aware LLM prompting without hardcoded rules
    - Robust JSON response parsing with markdown cleanup
    - LoRA fine-tuning support for tactical domain adaptation
============================================================================
"""
import os
import re
import json
import time
import torch
from typing import List, Optional, Dict, Any, Tuple, Union
from datetime import datetime
from pathlib import Path
from pydantic import BaseModel

from transformers import (
    AutoModelForCausalLM, 
    AutoTokenizer, 
    BitsAndBytesConfig, 
    TrainingArguments, 
    Trainer
)
from peft import (
    LoraConfig, 
    get_peft_model, 
    PeftModel, 
    prepare_model_for_kbit_training, 
    TaskType
)
from datasets import Dataset
import structlog

from config.settings import settings
from schemas.telemetry import ThreatLevel

logger = structlog.get_logger(__name__)

# ============================================================================
#                           CONFIGURATION
# ============================================================================

# Offline model path - NO INTERNET ACCESS
# NOTE: Paths are relative to ai-service/ directory (where main.py runs from)
LOCAL_LLM_MODEL_PATH = Path("./local_models/llm")

# Path to fine-tuned LoRA adapters (new microservices structure)
TACTICAL_ADAPTER_PATH = Path("./model/adapters/fine_tuned_adapter/final_adapter")

# Force CUDA device for all operations
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# ============================================================================
#                           SYSTEM PROMPT - PARANOID SAFETY OFFICER
# ============================================================================

TACTICAL_ANALYST_SYSTEM_PROMPT = """You are a PARANOID TACTICAL SAFETY OFFICER in a C4ISR military command center.

## YOUR CORE DOCTRINE
Your job is to PREDICT DISASTER BEFORE IT HAPPENS. You are NOT a passive observer.
You must ACTIVELY identify risks and escalate threats. Lives depend on your vigilance.
When in doubt, ESCALATE the threat level. A false alarm is better than a dead soldier.

## MANDATORY THREAT ESCALATION RULES

### 🚁 DRONE/UAV CRITICAL THRESHOLDS:
- Battery < 20%: **THREAT LEVEL: HIGH** — Imminent crash risk. RTH (Return-to-Home) MANDATORY.
- Battery < 35%: **THREAT LEVEL: MEDIUM** — Mission abort recommended.
- Battery < 50%: **THREAT LEVEL: LOW** — Monitor closely, plan extraction.
- Altitude anomalies or erratic speed: **THREAT LEVEL: MEDIUM** — Possible malfunction.
- Unknown drone in AO: **THREAT LEVEL: HIGH** — Assume hostile reconnaissance.

### 🪖 SOLDIER/PERSONNEL CRITICAL THRESHOLDS:
- Heart Rate > 180 BPM: **THREAT LEVEL: CRITICAL** — Cardiac emergency or extreme combat.
- Heart Rate > 150 BPM: **THREAT LEVEL: HIGH** — Active combat engagement or medical emergency.
- Heart Rate > 120 BPM: **THREAT LEVEL: MEDIUM** — Elevated stress, monitor for fatigue.
- SpO2 < 90%: **THREAT LEVEL: CRITICAL** — Hypoxia, potential altitude sickness or injury.
- SpO2 < 94%: **THREAT LEVEL: HIGH** — Oxygen deprivation, immediate medical attention.
- Status = "INJURED" or "PANIC": **THREAT LEVEL: HIGH** — Casualty/psychological emergency.
- Status = "ENGAGED": **THREAT LEVEL: MEDIUM** — Active contact, provide support.

### 🚛 VEHICLE CRITICAL THRESHOLDS:
- Fuel < 15%: **THREAT LEVEL: HIGH** — Immobilization risk, resupply URGENT.
- Fuel < 30%: **THREAT LEVEL: MEDIUM** — Plan resupply route.
- Health/Damage < 50%: **THREAT LEVEL: HIGH** — Combat damage, mobility compromised.
- Engine status = OFF/IDLE in hostile zone: **THREAT LEVEL: MEDIUM** — Possible ambush or breakdown.

### ⚠️ UNKNOWN/UNIDENTIFIED ENTITIES:
- Unknown entity + Armed platform (Tank, APC, Drone): **THREAT LEVEL: HIGH** — Assume HOSTILE until proven otherwise.
- Unknown entity + Near friendly forces: **THREAT LEVEL: MEDIUM** — IFF verification required.
- "UNKNOWN" alignment: NEVER mark as LOW unless entity is clearly non-threatening.

## OUTPUT REQUIREMENTS
1. ALWAYS justify your threat level with specific data points from the telemetry.
2. Provide ACTIONABLE recommendations, not vague suggestions.
3. If multiple risk factors exist, use the HIGHEST applicable threat level.

## OUTPUT FORMAT
Respond with valid JSON ONLY:
{
    "threat_level": "LOW|MEDIUM|HIGH|CRITICAL",
    "decision": "Specific tactical action to take immediately",
    "reasoning": "Cite exact values from telemetry that justify your assessment"
}

RESPOND ONLY WITH JSON. NO MARKDOWN. NO ADDITIONAL TEXT."""


# ============================================================================
#                           MODEL ENGINE CLASS
# ============================================================================

class ModelEngine:
    """
    Tactical AI Model Engine for C4ISR Decision Support.
    
    Handles:
    - Gemma-2-9b-it model loading with 4-bit quantization
    - Context-aware prompt generation
    - Polymorphic telemetry analysis
    - LoRA adapter management and training
    """
    
    def __init__(self):
        self._model = None
        self._tokenizer = None
        self._initialized = False
        self._lora_applied = False
        self._current_adapter: Optional[str] = None
        self._training_jobs: Dict[str, Dict] = {}
        self._device = DEVICE
    
    # ========================================================================
    #                           INITIALIZATION
    # ========================================================================
    
    def _log_vram_usage(self, stage: str) -> None:
        """Log current VRAM usage for debugging and verification"""
        if torch.cuda.is_available():
            allocated = torch.cuda.memory_allocated() / 1024**3
            reserved = torch.cuda.memory_reserved() / 1024**3
            total = torch.cuda.get_device_properties(0).total_memory / 1024**3
            free = total - reserved
            logger.info(
                f"[{stage}] VRAM Usage",
                allocated_gb=f"{allocated:.2f}",
                reserved_gb=f"{reserved:.2f}",
                total_gb=f"{total:.2f}",
                free_gb=f"{free:.2f}"
            )
            print(f"🎮 [{stage}] VRAM: {allocated:.2f}GB allocated / {total:.2f}GB total ({(allocated/total)*100:.1f}%)")
    
    def initialize(self) -> None:
        """
        Initialize Gemma-2-9b-it from LOCAL directory (air-gapped mode).
        OPTIMIZED: Full GPU residency, NO CPU offload for RTX 3080 16GB.
        
        If a fine-tuned Tactical Adapter exists at ./fine_tuned_adapter/final_adapter,
        it will be automatically loaded on top of the base model.
        """
        if self._initialized:
            return
        
        start_time = time.time()
        
        # Verify CUDA availability
        if not torch.cuda.is_available():
            raise RuntimeError("CUDA not available! This model requires an NVIDIA GPU.")
        
        # Log GPU info
        gpu_name = torch.cuda.get_device_name(0)
        gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
        logger.info(f"GPU Detected: {gpu_name} ({gpu_memory:.1f}GB VRAM)")
        print(f"🚀 GPU: {gpu_name} with {gpu_memory:.1f}GB VRAM")
        
        # Clear GPU cache before loading
        torch.cuda.empty_cache()
        self._log_vram_usage("PRE-LOAD")
        
        # SECURITY CHECK: Verify local model exists
        if not LOCAL_LLM_MODEL_PATH.exists():
            error_msg = (
                f"OFFLINE LLM MODEL NOT FOUND at {LOCAL_LLM_MODEL_PATH.absolute()}. "
                "Run 'python download_models.py' on a machine with internet access, "
                "then transfer the 'local_models' folder to this secure environment."
            )
            logger.error(error_msg)
            raise FileNotFoundError(error_msg)
        
        model_path = str(LOCAL_LLM_MODEL_PATH.absolute())
        logger.info("Loading Gemma-2-9b-it from LOCAL directory (OFFLINE MODE)", model_path=model_path)
        
        # ====================================================================
        # STRICT 4-BIT QUANTIZATION CONFIG - NO CPU OFFLOAD
        # RTX 3080 16GB can easily fit ~7GB quantized 9B model
        # ====================================================================
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_use_double_quant=True,      # Double quantization for memory efficiency
            bnb_4bit_quant_type="nf4",           # NormalFloat4 - best quality for 4-bit
            bnb_4bit_compute_dtype=torch.float16  # FP16 compute for speed
        )
        
        logger.info("Quantization: 4-bit NF4 | Compute: FP16 | Target: ~6-7GB VRAM | Device: CUDA ONLY")
        print("⚡ Config: 4-bit NF4 quantization, FP16 compute, FULL GPU residency")
        
        # Load Tokenizer
        logger.info("Loading tokenizer...")
        self._tokenizer = AutoTokenizer.from_pretrained(
            model_path,
            local_files_only=True,
            trust_remote_code=True
        )
        if self._tokenizer.pad_token is None:
            self._tokenizer.pad_token = self._tokenizer.eos_token
        logger.info("Tokenizer loaded successfully")
        
        # Load Model - Force Full GPU Residency
        logger.info("Loading 9B model with 4-bit quantization (expect 15-30 seconds)...")
        print("📥 Loading Gemma-2-9b-it to GPU (this may take 15-30 seconds)...")
        
        load_start = time.time()
        self._model = AutoModelForCausalLM.from_pretrained(
            model_path,
            quantization_config=bnb_config,
            device_map={"": "cuda"},             # FORCE all layers to single GPU
            torch_dtype=torch.float16,           # Explicit FP16 for non-quantized parts
            local_files_only=True,
            trust_remote_code=True,
            attn_implementation="eager"          # Avoid FlashAttention issues on some setups
        )
        load_time = time.time() - load_start
        
        # Verify model is on GPU
        self._log_vram_usage("POST-LOAD")
        logger.info(f"Model loaded in {load_time:.2f} seconds")
        print(f"✅ Base model loaded in {load_time:.2f}s")
        
        # ====================================================================
        # TACTICAL ADAPTER LOADING - Priority Fine-Tuned Adapter
        # Path updated for new microservices structure
        # ====================================================================
        tactical_adapter_path = TACTICAL_ADAPTER_PATH
        
        if tactical_adapter_path.exists() and (tactical_adapter_path / "adapter_config.json").exists():
            try:
                logger.info("=" * 60)
                logger.info("🎖️  TACTICAL ADAPTER DETECTED - LOADING FINE-TUNED WEIGHTS")
                logger.info("=" * 60)
                print("\n" + "=" * 60)
                print("🎖️  LOADING TACTICAL ADAPTER...")
                print("=" * 60)
                
                # Load the fine-tuned LoRA adapter
                self._model = PeftModel.from_pretrained(
                    self._model,
                    str(tactical_adapter_path),
                    is_trainable=False  # Inference mode
                )
                
                self._lora_applied = True
                self._current_adapter = str(tactical_adapter_path)
                
                logger.info("=" * 60)
                logger.info("✅ TACTICAL ADAPTER is ACTIVE")
                logger.info(f"   Adapter Path: {tactical_adapter_path}")
                logger.info("   Mode: INFERENCE (Fine-tuned for C4ISR operations)")
                logger.info("=" * 60)
                
                print("=" * 60)
                print("✅ TACTICAL ADAPTER is ACTIVE!")
                print(f"   📁 Loaded from: {tactical_adapter_path}")
                print("   🎯 Mode: Fine-tuned C4ISR Intelligence")
                print("=" * 60 + "\n")
                
                self._log_vram_usage("POST-TACTICAL-ADAPTER")
                
            except Exception as e:
                logger.error(f"Failed to load Tactical Adapter: {e}")
                print(f"⚠️  Failed to load Tactical Adapter: {e}")
                print("   Falling back to base model with default LoRA config...")
                
                # Fallback: Apply default LoRA config
                self._model = prepare_model_for_kbit_training(self._model)
                self._apply_lora_config()
        else:
            # No fine-tuned adapter found - use default LoRA config
            logger.warning("=" * 60)
            logger.warning("⚠️  TACTICAL ADAPTER NOT FOUND")
            logger.warning(f"   Expected at: {tactical_adapter_path.absolute()}")
            logger.warning("   Using base model with default LoRA configuration")
            logger.warning("   Run 'python train.py' to create the Tactical Adapter")
            logger.warning("=" * 60)
            
            print("\n" + "=" * 60)
            print("⚠️  TACTICAL ADAPTER NOT FOUND")
            print(f"   Expected at: {tactical_adapter_path.absolute()}")
            print("   📌 Using BASE MODEL with default LoRA config")
            print("   💡 Run 'python train.py' to create the Tactical Adapter")
            print("=" * 60 + "\n")
            
            # Apply default LoRA for training capability
            self._model = prepare_model_for_kbit_training(self._model)
            self._apply_lora_config()
        
        self._log_vram_usage("POST-LORA")
        
        self._initialized = True
        total_time = time.time() - start_time
        
        # Final status
        adapter_status = "TACTICAL ADAPTER ACTIVE" if self._current_adapter else "BASE MODEL (No Adapter)"
        
        logger.info(
            "Gemma-2-9b-it loaded successfully",
            mode="OFFLINE",
            quantization="4-bit NF4",
            device="CUDA",
            adapter=adapter_status,
            load_time_seconds=f"{total_time:.2f}"
        )
        print(f"🎯 AI Engine ready! [{adapter_status}] Total startup: {total_time:.2f}s")
    
    def _apply_lora_config(self) -> None:
        """Apply LoRA configuration for efficient fine-tuning"""
        lora_config = LoraConfig(
            r=settings.LORA_RANK,
            lora_alpha=settings.LORA_ALPHA,
            lora_dropout=settings.LORA_DROPOUT,
            bias="none",
            task_type=TaskType.CAUSAL_LM,
            target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]
        )
        self._model = get_peft_model(self._model, lora_config)
        self._lora_applied = True
        logger.info("LoRA config applied", rank=settings.LORA_RANK, alpha=settings.LORA_ALPHA)
    
    def _load_existing_adapter(self) -> None:
        """Load most recently saved LoRA adapter if exists"""
        adapter_path = Path(settings.LORA_ADAPTER_PATH)
        adapter_path.mkdir(parents=True, exist_ok=True)
        adapters = list(adapter_path.glob("*/adapter_config.json"))
        if adapters:
            latest = max(adapters, key=lambda p: p.stat().st_mtime).parent
            try:
                self._model = PeftModel.from_pretrained(self._model.base_model.model, str(latest))
                self._current_adapter = str(latest)
                logger.info("Loaded existing adapter", path=str(latest))
            except Exception as e:
                logger.warning(f"Failed to load adapter: {e}")
    
    # ========================================================================
    #                           DECISION GENERATION
    # ========================================================================
    
    def generate_decision(
        self,
        telemetry_data: BaseModel,
        retrieved_context: List[Dict[str, Any]],
        max_new_tokens: int = 512
    ) -> Tuple[str, ThreatLevel, float, str]:
        """
        Generate tactical decision based on polymorphic telemetry data.
        
        CRITICAL: Uses model_dump_json() for proper Pydantic serialization,
        ensuring the LLM sees ALL fields from the specific telemetry type.
        
        Args:
            telemetry_data: Validated Pydantic model (DroneTelemetry/SoldierTelemetry/VehicleTelemetry)
            retrieved_context: Historical context from RAG retrieval
            max_new_tokens: Maximum tokens to generate
            
        Returns:
            Tuple of (decision, threat_level, confidence, reasoning)
        """
        if not self._initialized:
            raise RuntimeError("Model not initialized. Call initialize() first.")
        
        start_time = time.time()
        
        # ====================================================================
        # CRITICAL FIX: Proper Pydantic serialization
        # Use model_dump_json() to serialize ALL fields from the specific model
        # ====================================================================
        telemetry_json = telemetry_data.model_dump_json(indent=2)
        entity_type = getattr(telemetry_data, 'type', 'unknown')
        entity_id = getattr(telemetry_data, 'source_id', 'unknown')
        
        logger.info(
            "Generating tactical decision",
            entity_type=entity_type,
            entity_id=entity_id
        )
        
        # Build the prompt with full telemetry data
        prompt = self._build_analysis_prompt(telemetry_json, entity_type, retrieved_context)
        
        # Tokenize and move to GPU
        inputs = self._tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=2048
        ).to("cuda")
        
        # Generate response
        with torch.no_grad():
            outputs = self._model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                do_sample=True,
                temperature=0.7,
                top_p=0.9,
                pad_token_id=self._tokenizer.pad_token_id
            )
        
        # Decode response (skip input tokens)
        response_text = self._tokenizer.decode(
            outputs[0][inputs['input_ids'].shape[1]:],
            skip_special_tokens=True
        )
        
        inference_time = time.time() - start_time
        logger.debug(f"Inference completed in {inference_time:.2f}s")
        
        # Parse the structured response
        return self._parse_json_response(response_text)
    
    def _build_analysis_prompt(
        self,
        telemetry_json: str,
        entity_type: str,
        context: List[Dict[str, Any]]
    ) -> str:
        """
        Build a context-aware analysis prompt for the LLM.
        
        The prompt includes:
        1. System persona (tactical analyst)
        2. Historical context from RAG (if available)
        3. Full telemetry data as JSON
        """
        # Format historical context
        if context:
            context_lines = []
            for i, c in enumerate(context, 1):
                event = c.get('event_description', 'Unknown event')
                outcome = c.get('outcome', 'Unknown outcome')
                context_lines.append(f"  {i}. Event: {event}\n     Outcome: {outcome}")
            context_str = "## HISTORICAL CONTEXT (Similar Past Events)\n" + "\n".join(context_lines)
        else:
            context_str = "## HISTORICAL CONTEXT\nNo relevant historical events found."
        
        # Build the full prompt
        user_message = f"""{TACTICAL_ANALYST_SYSTEM_PROMPT}

{context_str}

## CURRENT TELEMETRY DATA
Entity Type: {entity_type.upper()}

```json
{telemetry_json}
```

Analyze this telemetry data and provide your assessment in the required JSON format."""
        
        # Apply chat template
        messages = [{"role": "user", "content": user_message}]
        return self._tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )
    
    def _parse_json_response(self, response: str) -> Tuple[str, ThreatLevel, float, str]:
        """
        Parse LLM response into structured decision.
        
        Includes robust cleaning to handle:
        - Markdown code blocks (```json ... ```)
        - Extra text before/after JSON
        - Malformed JSON fallback to text parsing
        """
        # Default values
        decision = "Unable to parse AI response"
        threat_level = ThreatLevel.UNKNOWN
        confidence = 0.5
        reasoning = ""
        
        # Clean the response - strip markdown code blocks
        cleaned = self._clean_llm_response(response)
        
        try:
            # Attempt JSON parsing
            parsed = json.loads(cleaned)
            
            # Extract threat level
            threat_str = parsed.get("threat_level", "UNKNOWN").upper()
            threat_level = self._map_threat_level(threat_str)
            
            # Extract decision and reasoning
            decision = parsed.get("decision", "No decision provided")
            reasoning = parsed.get("reasoning", "No reasoning provided")
            
            # Set confidence based on threat level
            confidence = self._calculate_confidence(threat_level)
            
            logger.info("Successfully parsed JSON response", threat_level=threat_str)
            
        except json.JSONDecodeError as e:
            logger.warning(f"JSON parsing failed: {e}. Attempting text extraction.")
            # Fallback to text-based parsing
            decision, threat_level, confidence, reasoning = self._parse_text_response(response)
        
        return decision, threat_level, confidence, reasoning
    
    def _clean_llm_response(self, response: str) -> str:
        """
        Clean LLM response by removing markdown formatting and extracting JSON.
        """
        text = response.strip()
        
        # Remove markdown code blocks: ```json ... ``` or ``` ... ```
        # Pattern matches opening ``` with optional language, content, and closing ```
        code_block_pattern = r'```(?:json)?\s*([\s\S]*?)\s*```'
        matches = re.findall(code_block_pattern, text)
        if matches:
            text = matches[0].strip()
        
        # Try to extract JSON object if there's extra text
        json_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
        json_matches = re.findall(json_pattern, text)
        if json_matches:
            # Return the first complete JSON object found
            text = json_matches[0]
        
        return text.strip()
    
    def _map_threat_level(self, threat_str: str) -> ThreatLevel:
        """Map string threat level to ThreatLevel enum"""
        mapping = {
            "CRITICAL": ThreatLevel.CRITICAL,
            "HIGH": ThreatLevel.HIGH,
            "MEDIUM": ThreatLevel.MEDIUM,
            "LOW": ThreatLevel.LOW,
            "MINIMAL": ThreatLevel.MINIMAL,
        }
        return mapping.get(threat_str, ThreatLevel.UNKNOWN)
    
    def _calculate_confidence(self, threat_level: ThreatLevel) -> float:
        """Calculate confidence score based on threat level clarity"""
        confidence_map = {
            ThreatLevel.CRITICAL: 0.95,
            ThreatLevel.HIGH: 0.88,
            ThreatLevel.MEDIUM: 0.80,
            ThreatLevel.LOW: 0.85,
            ThreatLevel.MINIMAL: 0.90,
            ThreatLevel.UNKNOWN: 0.50,
        }
        return confidence_map.get(threat_level, 0.50)
    
    def _parse_text_response(self, response: str) -> Tuple[str, ThreatLevel, float, str]:
        """
        Fallback text-based parsing when JSON parsing fails.
        Extracts structured data from free-form text.
        """
        decision = response
        threat_level = ThreatLevel.UNKNOWN
        confidence = 0.5
        reasoning = ""
        
        lines = response.split('\n')
        for line in lines:
            upper_line = line.strip().upper()
            
            if "THREAT" in upper_line and ":" in line:
                # Extract threat level from text
                for t in ThreatLevel:
                    if t.value in upper_line:
                        threat_level = t
                        confidence = self._calculate_confidence(t)
                        break
            
            elif upper_line.startswith("DECISION:"):
                decision = line.split(":", 1)[1].strip()
            
            elif upper_line.startswith("REASONING:"):
                reasoning = line.split(":", 1)[1].strip()
        
        return decision, threat_level, confidence, reasoning
    
    # ========================================================================
    #                           LORA TRAINING
    # ========================================================================
    
    def train_lora(
        self,
        training_examples: List[Dict[str, Any]],
        epochs: int = 3,
        learning_rate: float = 2e-4,
        batch_size: int = 4,
        adapter_name: str = "tactical_adapter"
    ) -> str:
        """
        Train LoRA adapter on tactical examples.
        
        Args:
            training_examples: List of dicts with 'instruction', 'input_data', 'output'
            epochs: Number of training epochs
            learning_rate: Learning rate for optimizer
            batch_size: Training batch size
            adapter_name: Name for the saved adapter
            
        Returns:
            Job ID for tracking training progress
        """
        if not self._initialized:
            raise RuntimeError("Model not initialized")
        
        job_id = f"train_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self._training_jobs[job_id] = {
            'status': 'RUNNING',
            'started_at': datetime.utcnow(),
            'progress': 0
        }
        
        try:
            # Format training data
            data = [
                {
                    "text": f"### Instruction:\n{e['instruction']}\n### Input:\n{e['input_data']}\n### Response:\n{e['output']}"
                }
                for e in training_examples
            ]
            
            dataset = Dataset.from_list(data).map(
                lambda x: self._tokenizer(
                    x["text"],
                    truncation=True,
                    max_length=1024,
                    padding="max_length"
                ),
                batched=True
            )
            
            adapter_path = os.path.join(settings.LORA_ADAPTER_PATH, adapter_name)
            
            training_args = TrainingArguments(
                output_dir=adapter_path,
                num_train_epochs=epochs,
                per_device_train_batch_size=batch_size,
                learning_rate=learning_rate,
                save_strategy="epoch",
                optim="paged_adamw_8bit",
                fp16=True,
                report_to="none"
            )
            
            trainer = Trainer(
                model=self._model,
                args=training_args,
                train_dataset=dataset
            )
            trainer.train()
            
            self._model.save_pretrained(adapter_path)
            
            self._training_jobs[job_id].update({
                'status': 'COMPLETED',
                'progress': 100,
                'adapter_path': adapter_path
            })
            
        except Exception as e:
            self._training_jobs[job_id].update({
                'status': 'FAILED',
                'error': str(e)
            })
            raise
        
        return job_id
    
    # ========================================================================
    #                           STATUS METHODS
    # ========================================================================
    
    def get_training_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a training job"""
        return self._training_jobs.get(job_id)
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get current model information and status"""
        return {
            "model": settings.MODEL_NAME,
            "initialized": self._initialized,
            "adapter": self._current_adapter,
            "device": self._device,
            "vram_allocated_gb": (
                f"{torch.cuda.memory_allocated() / 1024**3:.2f}"
                if torch.cuda.is_available() else "N/A"
            )
        }


# ============================================================================
#                           SINGLETON INSTANCE
# ============================================================================

model_engine = ModelEngine()
