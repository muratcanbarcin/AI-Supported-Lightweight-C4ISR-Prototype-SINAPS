"""
============================================================================
    C4ISR DUAL-ENGINE MODEL ENGINE — ANALYSIS + CHAT
============================================================================
    SECURITY: OFFLINE MODE — Models loaded from local directories only.
              No external network calls to HuggingFace or any API permitted.
============================================================================
    ENGINE 1 (Analysis): Google Gemma-2-9b-it (with LoRA Tactical Adapter)
        → Handles POST /analyze (JSON threat assessment)
        → Path: local_models/llm

    ENGINE 2 (Chat): Meta-Llama-3.1-8B-Instruct
        → Handles POST /chat (conversational military assistant)
        → Path: local_models/llama_chat

    HARDWARE TARGET: NVIDIA RTX 3080 (16GB VRAM) / 32GB System RAM
    QUANTIZATION: Both models 4-bit NF4 (~5-6GB each, ~10-12GB total)
    OPTIMIZATION: device_map="auto" for intelligent layer placement
============================================================================
    KEY FEATURES:
    - Dual-model inference on a single GPU via aggressive quantization
    - Polymorphic telemetry handling via Pydantic model serialization
    - Context-aware LLM prompting without hardcoded rules
    - Robust JSON response parsing with markdown cleanup
    - LoRA fine-tuning support for tactical domain adaptation (Gemma only)
    - Turkish military assistant persona for chat (Llama)
============================================================================
"""
import os
import re
import json
import time
import gc
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

# Offline model paths — NO INTERNET ACCESS
# NOTE: Paths are relative to ai-service/ directory (where main.py runs from)
LOCAL_GEMMA_MODEL_PATH = Path("./local_models/llm")           # Engine 1: Analysis
LOCAL_LLAMA_MODEL_PATH = Path("./local_models/llama_chat")    # Engine 2: Chat

# Path to fine-tuned LoRA adapters (Gemma only)
TACTICAL_ADAPTER_PATH = Path("./model/adapters/fine_tuned_adapter/final_adapter")

# Force CUDA device for all operations
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# ============================================================================
#          4-BIT QUANTIZATION CONFIG — SHARED BY BOTH ENGINES
# ============================================================================

def _create_bnb_config() -> BitsAndBytesConfig:
    """
    Create BitsAndBytes 4-bit quantization config.
    Shared between Gemma (analysis) and Llama (chat) engines.
    Both MUST use identical quantization to fit on single RTX 3080 16GB.
    """
    return BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_use_double_quant=True,       # Double quantization for extra savings
        bnb_4bit_quant_type="nf4",            # NormalFloat4 — best quality for 4-bit
        bnb_4bit_compute_dtype=torch.float16  # FP16 compute for speed
    )

# ============================================================================
#                SYSTEM PROMPT — GEMMA (ANALYSIS / JSON OUTPUT)
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
#              SYSTEM PROMPT — LLAMA (CHAT / TURKISH MILITARY ASSISTANT)
# ============================================================================

LLAMA_CHAT_SYSTEM_PROMPT = (
    "Sen TSK C4ISR Karargahında görevli yapay zeka tabanlı bir Kurmay Asistanısın. "
    "Duygusuz, ciddi ve net bir askeri dil kullan. "
    "Asla şaka yapma, fıkra anlatma veya günlük muhabbete girme; "
    "böyle bir istek gelirse reddet ve görevine dön.\n\n"
    "Sana bir [SORU] ve referans olması için veritabanından çekilmiş bir [DOKTRIN] verilecek.\n\n"
    "KURAL 1: Eğer [DOKTRIN] soruyla alakalı ve mantıklıysa, "
    "taktiksel tavsiyeni kesinlikle bu doktrine dayandır.\n\n"
    "KURAL 2: Eğer [DOKTRIN] boşsa veya soruyla tamamen alakasızsa, "
    "doktrini görmezden gel ve kendi askeri/taktiksel zekanı kullanarak "
    "en doğru karargah tavsiyesini ver.\n\n"
    "Cevapların her zaman kısa, eyleme dönük ve askeri formatta olsun."
)


# ============================================================================
#                       DUAL-ENGINE MODEL CLASS
# ============================================================================

class ModelEngine:
    """
    Dual-Engine Tactical AI Model Engine for C4ISR Decision Support.

    Engine 1 — Gemma-2-9b-it (Analysis):
        - 4-bit NF4 quantized (~5-6 GB VRAM)
        - LoRA tactical adapter (if available)
        - JSON threat assessment output
        - Used by: generate_analysis()

    Engine 2 — Meta-Llama-3.1-8B-Instruct (Chat):
        - 4-bit NF4 quantized (~5-6 GB VRAM)
        - No LoRA, base instruct model only
        - Turkish free-text conversational output
        - Used by: generate_chat()

    Total estimated VRAM: ~10-12 GB (fits RTX 3080 16GB)
    """

    def __init__(self):
        # ── Engine 1: Gemma (Analysis) ──
        self._gemma_model = None
        self._gemma_tokenizer = None

        # ── Engine 2: Llama (Chat) ──
        self._llama_model = None
        self._llama_tokenizer = None

        # ── State ──
        self._initialized = False
        self._lora_applied = False
        self._current_adapter: Optional[str] = None
        self._training_jobs: Dict[str, Dict] = {}
        self._device = DEVICE

    # ========================================================================
    #                           VRAM MONITORING
    # ========================================================================

    @staticmethod
    def _log_vram_usage(stage: str) -> None:
        """Log current VRAM usage for debugging and verification."""
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
            print(
                f"🎮 [{stage}] VRAM: {allocated:.2f}GB allocated / "
                f"{total:.2f}GB total ({(allocated/total)*100:.1f}%)"
            )

    # ========================================================================
    #                      INITIALIZATION — DUAL ENGINE
    # ========================================================================

    def initialize(self) -> None:
        """
        Initialize BOTH engines from LOCAL directories (air-gapped mode).

        Load order:
            1. Gemma-2-9b-it  → Analysis engine (+ optional LoRA adapter)
            2. Llama-3.1-8B   → Chat engine (base only, no LoRA)

        Both use 4-bit NF4 quantization with device_map="auto" to share
        the GPU intelligently and prevent OOM on RTX 3080 16GB.
        """
        if self._initialized:
            return

        start_time = time.time()

        # ── Verify CUDA availability ─────────────────────────────────
        if not torch.cuda.is_available():
            raise RuntimeError(
                "CUDA not available! Dual-engine architecture requires an NVIDIA GPU."
            )

        gpu_name = torch.cuda.get_device_name(0)
        gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
        logger.info(f"GPU Detected: {gpu_name} ({gpu_memory:.1f}GB VRAM)")
        print(f"🚀 GPU: {gpu_name} with {gpu_memory:.1f}GB VRAM")
        print("=" * 70)
        print("   DUAL-ENGINE ARCHITECTURE — Loading 2 Models to Single GPU")
        print("   Engine 1: Gemma-2-9b-it  (Analysis + LoRA)")
        print("   Engine 2: Llama-3.1-8B   (Chat)")
        print("   Quantization: 4-bit NF4 for both engines")
        print("=" * 70)

        # Clear GPU cache before loading
        torch.cuda.empty_cache()
        gc.collect()
        self._log_vram_usage("PRE-LOAD (Clean)")

        # ── Load Engine 1: Gemma (Analysis) ──────────────────────────
        self._load_gemma_engine()
        self._log_vram_usage("POST-GEMMA")

        # ── Load Engine 2: Llama (Chat) ──────────────────────────────
        self._load_llama_engine()
        self._log_vram_usage("POST-LLAMA (Both Models Loaded)")

        # ── Final Status ─────────────────────────────────────────────
        self._initialized = True
        total_time = time.time() - start_time

        adapter_status = (
            "TACTICAL ADAPTER ACTIVE" if self._current_adapter
            else "BASE MODEL (No Adapter)"
        )

        logger.info(
            "🎯 DUAL-ENGINE initialized successfully",
            mode="OFFLINE",
            engine1="Gemma-2-9b-it (Analysis)",
            engine1_adapter=adapter_status,
            engine2="Llama-3.1-8B-Instruct (Chat)",
            quantization="4-bit NF4 (both)",
            device="CUDA",
            load_time_seconds=f"{total_time:.2f}"
        )
        print("\n" + "=" * 70)
        print("✅ DUAL-ENGINE READY")
        print(f"   🔬 Engine 1 (Analysis): Gemma-2-9b-it [{adapter_status}]")
        print(f"   💬 Engine 2 (Chat):     Llama-3.1-8B-Instruct")
        print(f"   ⏱️  Total startup: {total_time:.2f}s")
        print("=" * 70 + "\n")

    # ────────────────────────────────────────────────────────────────
    #  ENGINE 1: Gemma-2-9b-it  (Analysis + LoRA)
    # ────────────────────────────────────────────────────────────────

    def _load_gemma_engine(self) -> None:
        """Load Engine 1: Gemma-2-9b-it with optional LoRA tactical adapter."""

        if not LOCAL_GEMMA_MODEL_PATH.exists():
            error_msg = (
                f"GEMMA MODEL NOT FOUND at {LOCAL_GEMMA_MODEL_PATH.absolute()}. "
                "Run 'python download_models.py' on a machine with internet access, "
                "then transfer the 'local_models/llm' folder to this secure environment."
            )
            logger.error(error_msg)
            raise FileNotFoundError(error_msg)

        model_path = str(LOCAL_GEMMA_MODEL_PATH.absolute())
        bnb_config = _create_bnb_config()

        logger.info("ENGINE 1: Loading Gemma-2-9b-it (Analysis)...", path=model_path)
        print("\n📥 [Engine 1] Loading Gemma-2-9b-it (Analysis)...")
        print("   ⚡ 4-bit NF4 | FP16 compute | device_map=auto")

        # Tokenizer
        self._gemma_tokenizer = AutoTokenizer.from_pretrained(
            model_path,
            local_files_only=True,
            trust_remote_code=True
        )
        if self._gemma_tokenizer.pad_token is None:
            self._gemma_tokenizer.pad_token = self._gemma_tokenizer.eos_token

        # Model
        load_start = time.time()
        self._gemma_model = AutoModelForCausalLM.from_pretrained(
            model_path,
            quantization_config=bnb_config,
            device_map="auto",
            torch_dtype=torch.float16,
            local_files_only=True,
            trust_remote_code=True,
            attn_implementation="eager"
        )
        load_time = time.time() - load_start
        logger.info(f"Gemma base model loaded in {load_time:.2f}s")
        print(f"   ✅ Gemma base loaded in {load_time:.2f}s")

        # ── LoRA Tactical Adapter ────────────────────────────────────
        self._apply_tactical_adapter()

    def _apply_tactical_adapter(self) -> None:
        """
        Attempt to load the fine-tuned Tactical LoRA Adapter on top of Gemma.
        Falls back to default LoRA config if adapter not found.
        """
        tactical_adapter_path = TACTICAL_ADAPTER_PATH

        if (tactical_adapter_path.exists()
                and (tactical_adapter_path / "adapter_config.json").exists()):
            try:
                logger.info("🎖️ TACTICAL ADAPTER DETECTED — loading fine-tuned weights")
                print("   🎖️ Loading Tactical Adapter...")

                self._gemma_model = PeftModel.from_pretrained(
                    self._gemma_model,
                    str(tactical_adapter_path),
                    is_trainable=False  # Inference mode
                )

                self._lora_applied = True
                self._current_adapter = str(tactical_adapter_path)

                logger.info(
                    "✅ TACTICAL ADAPTER is ACTIVE",
                    adapter_path=str(tactical_adapter_path)
                )
                print(f"   ✅ Tactical Adapter ACTIVE: {tactical_adapter_path}")

            except Exception as e:
                logger.error(f"Failed to load Tactical Adapter: {e}")
                print(f"   ⚠️ Failed to load Tactical Adapter: {e}")
                print("   📌 Falling back to default LoRA config...")
                self._gemma_model = prepare_model_for_kbit_training(self._gemma_model)
                self._apply_lora_config()
        else:
            logger.warning(
                "⚠️ TACTICAL ADAPTER NOT FOUND",
                expected_path=str(tactical_adapter_path.absolute())
            )
            print(f"   ⚠️ No Tactical Adapter at: {tactical_adapter_path.absolute()}")
            print("   📌 Using BASE MODEL with default LoRA config")
            print("   💡 Run 'python train.py' to create the Tactical Adapter")
            self._gemma_model = prepare_model_for_kbit_training(self._gemma_model)
            self._apply_lora_config()

    def _apply_lora_config(self) -> None:
        """Apply default LoRA configuration for efficient fine-tuning (Gemma only)."""
        lora_config = LoraConfig(
            r=settings.LORA_RANK,
            lora_alpha=settings.LORA_ALPHA,
            lora_dropout=settings.LORA_DROPOUT,
            bias="none",
            task_type=TaskType.CAUSAL_LM,
            target_modules=[
                "q_proj", "k_proj", "v_proj", "o_proj",
                "gate_proj", "up_proj", "down_proj"
            ]
        )
        self._gemma_model = get_peft_model(self._gemma_model, lora_config)
        self._lora_applied = True
        logger.info(
            "Default LoRA config applied to Gemma",
            rank=settings.LORA_RANK,
            alpha=settings.LORA_ALPHA
        )

    # ────────────────────────────────────────────────────────────────
    #  ENGINE 2: Meta-Llama-3.1-8B-Instruct  (Chat)
    # ────────────────────────────────────────────────────────────────

    def _load_llama_engine(self) -> None:
        """Load Engine 2: Meta-Llama-3.1-8B-Instruct for conversational chat."""

        if not LOCAL_LLAMA_MODEL_PATH.exists():
            error_msg = (
                f"LLAMA MODEL NOT FOUND at {LOCAL_LLAMA_MODEL_PATH.absolute()}. "
                "Download Meta-Llama-3.1-8B-Instruct and place it in "
                "'local_models/llama_chat/'."
            )
            logger.error(error_msg)
            raise FileNotFoundError(error_msg)

        model_path = str(LOCAL_LLAMA_MODEL_PATH.absolute())
        bnb_config = _create_bnb_config()

        logger.info("ENGINE 2: Loading Llama-3.1-8B-Instruct (Chat)...", path=model_path)
        print("\n📥 [Engine 2] Loading Llama-3.1-8B-Instruct (Chat)...")
        print("   ⚡ 4-bit NF4 | FP16 compute | device_map=auto")

        # Tokenizer
        self._llama_tokenizer = AutoTokenizer.from_pretrained(
            model_path,
            local_files_only=True,
            trust_remote_code=True
        )
        if self._llama_tokenizer.pad_token is None:
            self._llama_tokenizer.pad_token = self._llama_tokenizer.eos_token

        # Model (NO LoRA — base instruct model only)
        load_start = time.time()
        self._llama_model = AutoModelForCausalLM.from_pretrained(
            model_path,
            quantization_config=bnb_config,
            device_map="auto",
            torch_dtype=torch.float16,
            local_files_only=True,
            trust_remote_code=True,
            attn_implementation="eager"
        )
        load_time = time.time() - load_start

        logger.info(f"Llama-3.1-8B loaded in {load_time:.2f}s")
        print(f"   ✅ Llama-3.1-8B loaded in {load_time:.2f}s")

    # ========================================================================
    #               ENGINE 1 — ANALYSIS (Gemma + LoRA)
    # ========================================================================

    def generate_analysis(
        self,
        telemetry_data: BaseModel,
        retrieved_context: List[Dict[str, Any]] = None,
        max_new_tokens: int = 512
    ) -> Tuple[str, ThreatLevel, float, str]:
        """
        Generate tactical threat assessment using Gemma-2-9b-it (Engine 1).

        Uses the same paranoid tactical analyst prompt + JSON output format
        as the original single-engine system.

        Args:
            telemetry_data:   Validated Pydantic model (Drone/Soldier/Vehicle)
            retrieved_context: Historical context from RAG retrieval
            max_new_tokens:   Maximum tokens to generate

        Returns:
            Tuple of (decision, threat_level, confidence, reasoning)
        """
        if not self._initialized:
            raise RuntimeError("Model not initialized. Call initialize() first.")

        if retrieved_context is None:
            retrieved_context = []

        start_time = time.time()

        # Serialize telemetry via Pydantic
        telemetry_json = telemetry_data.model_dump_json(indent=2)
        entity_type = getattr(telemetry_data, 'type', 'unknown')
        entity_id = getattr(telemetry_data, 'source_id', 'unknown')

        logger.info(
            "[Gemma] Generating tactical analysis",
            entity_type=entity_type,
            entity_id=entity_id
        )

        # Build prompt with RAG context
        prompt = self._build_analysis_prompt(
            telemetry_json, entity_type, retrieved_context
        )

        # Tokenize and move to GPU
        inputs = self._gemma_tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=2048
        ).to("cuda")

        # Generate response
        with torch.no_grad():
            outputs = self._gemma_model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                do_sample=True,
                temperature=0.7,
                top_p=0.9,
                pad_token_id=self._gemma_tokenizer.pad_token_id
            )

        # Decode (skip input tokens)
        response_text = self._gemma_tokenizer.decode(
            outputs[0][inputs['input_ids'].shape[1]:],
            skip_special_tokens=True
        )

        inference_time = time.time() - start_time
        logger.debug(
            f"[Gemma] Inference completed in {inference_time:.2f}s",
            response_preview=response_text[:200]
        )

        # Cleanup inference tensors
        del inputs, outputs
        torch.cuda.empty_cache()

        return self._parse_json_response(response_text)

    # ========================================================================
    #               ENGINE 2 — CHAT (Llama-3.1-8B-Instruct)
    # ========================================================================

    def generate_chat(
        self,
        query: str,
        rag_context: str = "",
        max_new_tokens: int = 256
    ) -> str:
        """
        Generate conversational response using Llama-3.1-8B-Instruct (Engine 2).

        Turkish military assistant persona. Short, authoritative answers.
        Uses Llama-3.1 chat template with system/user roles.

        Args:
            query:          Commander's question (free text)
            rag_context:    Pre-formatted doctrine context string (may be empty)
            max_new_tokens: Maximum tokens to generate (default 256 for conciseness)

        Returns:
            Free-form Turkish text response string
        """
        if not self._initialized:
            raise RuntimeError("Model not initialized. Call initialize() first.")

        start_time = time.time()

        logger.info("[Llama] Generating chat response", query=query[:80])

        # ── Build Llama-3.1 prompt with system + user roles ──────────
        doctrine_block = rag_context if rag_context else "Doktrin bilgisi bulunamadı."

        user_message = (
            f"[DOKTRIN]: {doctrine_block}\n\n"
            f"[SORU]: {query}"
        )

        messages = [
            {"role": "system", "content": LLAMA_CHAT_SYSTEM_PROMPT},
            {"role": "user", "content": user_message}
        ]

        # Apply Llama-3.1 chat template
        prompt = self._llama_tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )

        # Tokenize
        inputs = self._llama_tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=1024
        ).to("cuda")

        # Generate
        with torch.no_grad():
            outputs = self._llama_model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                do_sample=True,
                temperature=0.4,
                top_p=0.9,
                repetition_penalty=1.2,
                pad_token_id=self._llama_tokenizer.pad_token_id
            )

        # Decode (skip input tokens)
        response_text = self._llama_tokenizer.decode(
            outputs[0][inputs['input_ids'].shape[1]:],
            skip_special_tokens=True
        ).strip()

        # ── Post-processing ──────────────────────────────────────────
        raw_output = response_text
        logger.info("[Llama] Raw chat output", raw_text=raw_output[:300])

        # Strip any JSON artifacts the model might produce
        response_text = self._strip_json_artifacts(response_text)
        # Detect & truncate degenerate repetition
        response_text = self._clean_repetitive_output(response_text)

        # Safety: if post-processing emptied it, use raw output
        if not response_text or len(response_text) < 10:
            response_text = raw_output

        inference_time = time.time() - start_time
        logger.info(
            "[Llama] Chat response generated",
            query=query[:80],
            response_length=len(response_text),
            inference_time_s=f"{inference_time:.2f}",
        )

        # Cleanup inference tensors
        del inputs, outputs
        torch.cuda.empty_cache()

        return response_text

    # ========================================================================
    #       LEGACY COMPATIBILITY — generate_decision / generate_chat_response
    # ========================================================================

    def generate_decision(
        self,
        telemetry_data: BaseModel,
        retrieved_context: List[Dict[str, Any]] = None,
        max_new_tokens: int = 512
    ) -> Tuple[str, ThreatLevel, float, str]:
        """Legacy alias → routes to generate_analysis (Gemma engine)."""
        return self.generate_analysis(
            telemetry_data=telemetry_data,
            retrieved_context=retrieved_context or [],
            max_new_tokens=max_new_tokens
        )

    def generate_chat_response(
        self,
        query: str,
        rag_context: List[Dict[str, Any]] = None,
        max_new_tokens: int = 250
    ) -> str:
        """
        Legacy alias → routes to generate_chat (Llama engine).
        Converts the list-based rag_context to a flat string for Llama prompt.
        """
        if rag_context is None:
            rag_context = []

        # Convert list of dicts to a flat doctrine string for Llama
        doctrine_lines = []
        for c in rag_context:
            rule_text = c.get("context", c.get("event_description", ""))
            if rule_text:
                doctrine_lines.append(f"- {rule_text}")
        flat_context = "\n".join(doctrine_lines) if doctrine_lines else ""

        return self.generate_chat(
            query=query,
            rag_context=flat_context,
            max_new_tokens=max_new_tokens
        )

    # ========================================================================
    #               PROMPT BUILDING (Gemma / Analysis)
    # ========================================================================

    def _build_analysis_prompt(
        self,
        telemetry_json: str,
        entity_type: str,
        context: List[Dict[str, Any]]
    ) -> str:
        """
        Build a RAG-augmented analysis prompt for Gemma.

        Structure:
            1. System persona (paranoid tactical analyst)
            2. Retrieved engagement rules from pgvector (if available)
            3. Full telemetry data as JSON
            4. Instruction
        """
        # Format retrieved engagement rules
        if context:
            rule_lines = []
            for i, c in enumerate(context, 1):
                rule_text = c.get('event_description', 'Unknown')
                score = c.get('similarity_score', 0)
                category = c.get('outcome', 'UNKNOWN')
                rule_lines.append(
                    f"  RULE {i} (relevance: {score:.0%}, category: {category}):\n"
                    f"    {rule_text}"
                )
            context_str = (
                "## APPLICABLE ENGAGEMENT RULES (Retrieved from Tactical Memory)\n"
                "The following rules were retrieved by semantic similarity search.\n"
                "You MUST consider these rules in your analysis.\n\n"
                + "\n\n".join(rule_lines)
            )
        else:
            context_str = (
                "## ENGAGEMENT RULES\n"
                "No matching engagement rules found in tactical memory.\n"
                "Use your standard military doctrine knowledge."
            )

        # Assemble prompt
        user_message = f"""{TACTICAL_ANALYST_SYSTEM_PROMPT}

{context_str}

## CURRENT TELEMETRY DATA
Entity Type: {entity_type.upper()}

```json
{telemetry_json}
```

Based on the ENGAGEMENT RULES above and the TELEMETRY DATA, provide your tactical assessment in the required JSON format."""

        # Apply Gemma chat template
        messages = [{"role": "user", "content": user_message}]
        return self._gemma_tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )

    # ========================================================================
    #                       RESPONSE PARSING (Gemma / Analysis)
    # ========================================================================

    def _parse_json_response(self, response: str) -> Tuple[str, ThreatLevel, float, str]:
        """Parse Gemma's JSON response into structured decision."""
        decision = "Unable to parse AI response"
        threat_level = ThreatLevel.UNKNOWN
        confidence = 0.5
        reasoning = ""

        cleaned = self._clean_llm_response(response)

        try:
            parsed = json.loads(cleaned)
            threat_str = parsed.get("threat_level", "UNKNOWN").upper()
            threat_level = self._map_threat_level(threat_str)
            decision = parsed.get("decision", "No decision provided")
            reasoning = parsed.get("reasoning", "No reasoning provided")
            confidence = self._calculate_confidence(threat_level)
            logger.info("Successfully parsed JSON response", threat_level=threat_str)
        except json.JSONDecodeError as e:
            logger.warning(f"JSON parsing failed: {e}. Attempting text extraction.")
            decision, threat_level, confidence, reasoning = (
                self._parse_text_response(response)
            )

        return decision, threat_level, confidence, reasoning

    def _clean_llm_response(self, response: str) -> str:
        """Clean LLM response by removing markdown formatting and extracting JSON."""
        text = response.strip()

        # Remove markdown code blocks
        code_block_pattern = r'```(?:json)?\s*([\s\S]*?)\s*```'
        matches = re.findall(code_block_pattern, text)
        if matches:
            text = matches[0].strip()

        # Try to extract JSON object
        json_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
        json_matches = re.findall(json_pattern, text)
        if json_matches:
            text = json_matches[0]

        return text.strip()

    def _map_threat_level(self, threat_str: str) -> ThreatLevel:
        """Map string threat level to ThreatLevel enum."""
        mapping = {
            "CRITICAL": ThreatLevel.CRITICAL,
            "HIGH": ThreatLevel.HIGH,
            "MEDIUM": ThreatLevel.MEDIUM,
            "LOW": ThreatLevel.LOW,
            "MINIMAL": ThreatLevel.MINIMAL,
        }
        return mapping.get(threat_str, ThreatLevel.UNKNOWN)

    def _calculate_confidence(self, threat_level: ThreatLevel) -> float:
        """Calculate confidence score based on threat level clarity."""
        confidence_map = {
            ThreatLevel.CRITICAL: 0.95,
            ThreatLevel.HIGH: 0.88,
            ThreatLevel.MEDIUM: 0.80,
            ThreatLevel.LOW: 0.85,
            ThreatLevel.MINIMAL: 0.90,
            ThreatLevel.UNKNOWN: 0.50,
        }
        return confidence_map.get(threat_level, 0.50)

    def _parse_text_response(
        self, response: str
    ) -> Tuple[str, ThreatLevel, float, str]:
        """Fallback text-based parsing when JSON parsing fails."""
        decision = "MONITOR"
        threat_level = ThreatLevel.UNKNOWN
        confidence = 0.5
        reasoning = (
            response.strip()[:1000] if response.strip()
            else "AI response could not be parsed"
        )

        lines = response.split('\n')
        found_decision = False
        found_threat = False
        reasoning_parts = []

        for line in lines:
            upper_line = line.strip().upper()

            if not found_threat and "THREAT" in upper_line and ":" in line:
                for t in ThreatLevel:
                    if t.value in upper_line:
                        threat_level = t
                        confidence = self._calculate_confidence(t)
                        found_threat = True
                        break

            elif not found_decision and "DECISION" in upper_line and ":" in line:
                decision = line.split(":", 1)[1].strip()
                if decision:
                    found_decision = True

            elif "REASON" in upper_line and ":" in line:
                reasoning_parts.append(line.split(":", 1)[1].strip())

        if reasoning_parts:
            reasoning = " ".join(reasoning_parts)

        # Try common patterns in full text
        if not found_threat:
            upper_response = response.upper()
            if "CRITICAL" in upper_response:
                threat_level = ThreatLevel.CRITICAL
                confidence = 0.85
            elif "HIGH" in upper_response and (
                "THREAT" in upper_response or "RISK" in upper_response
            ):
                threat_level = ThreatLevel.HIGH
                confidence = 0.80
            elif "MEDIUM" in upper_response:
                threat_level = ThreatLevel.MEDIUM
                confidence = 0.75
            elif "LOW" in upper_response:
                threat_level = ThreatLevel.LOW
                confidence = 0.80

        return decision, threat_level, confidence, reasoning

    # ========================================================================
    #                       TEXT POST-PROCESSING
    # ========================================================================

    @staticmethod
    def _strip_json_artifacts(text: str) -> str:
        """
        Remove JSON-like artifacts from chat responses.
        Only strip JSON if meaningful text remains after removal.
        """
        if not text:
            return text

        text_stripped = text.strip()
        if text_stripped.startswith("{") and text_stripped.endswith("}"):
            try:
                parsed = json.loads(text_stripped)
                for key in [
                    "response", "cevap", "answer", "text",
                    "recommendation", "reasoning", "decision",
                    "content", "message"
                ]:
                    if (key in parsed
                            and isinstance(parsed[key], str)
                            and len(parsed[key]) > 5):
                        return parsed[key]
                text_values = [
                    v for v in parsed.values()
                    if isinstance(v, str) and len(v) > 10
                ]
                if text_values:
                    return "\n".join(text_values)
            except (json.JSONDecodeError, Exception):
                pass
            return text

        cleaned = re.sub(r'\{[^{}]{5,}\}', '', text)
        if cleaned.strip() and len(cleaned.strip()) > 30:
            return cleaned.strip()

        return text

    @staticmethod
    def _clean_repetitive_output(text: str) -> str:
        """Detect and truncate degenerate repetitive output from the model."""
        if not text:
            return text

        words = text.split()
        if len(words) < 10:
            return text

        # Single-word repetition (6+ consecutive)
        for i in range(len(words) - 5):
            word = words[i]
            if all(words[i + j] == word for j in range(1, 6)):
                truncated = " ".join(words[:i])
                if truncated.strip():
                    return truncated.strip()
                else:
                    return (
                        "The model encountered a generation error. "
                        "Please rephrase your question."
                    )

        # Phrase repetition (2-3 word phrases repeating)
        text_len = len(text)
        for phrase_len in range(5, 30):
            if text_len < phrase_len * 4:
                continue
            phrase = text[-phrase_len:]
            count = text.count(phrase)
            if count >= 4:
                first_pos = text.find(phrase)
                second_pos = text.find(phrase, first_pos + phrase_len)
                if second_pos > 0:
                    truncated = text[:second_pos].strip()
                    if truncated:
                        return truncated

        return text

    # ========================================================================
    #                       LORA TRAINING (Gemma Only)
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
        Train LoRA adapter on tactical examples (Gemma engine only).

        Args:
            training_examples: List of dicts with 'instruction', 'input_data', 'output'
            epochs:            Number of training epochs
            learning_rate:     Learning rate for optimizer
            batch_size:        Training batch size
            adapter_name:      Name for the saved adapter

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
            data = [
                {
                    "text": (
                        f"### Instruction:\n{e['instruction']}\n"
                        f"### Input:\n{e['input_data']}\n"
                        f"### Response:\n{e['output']}"
                    )
                }
                for e in training_examples
            ]

            dataset = Dataset.from_list(data).map(
                lambda x: self._gemma_tokenizer(
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
                model=self._gemma_model,
                args=training_args,
                train_dataset=dataset
            )
            trainer.train()

            self._gemma_model.save_pretrained(adapter_path)

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
        """Get status of a training job."""
        return self._training_jobs.get(job_id)

    def get_model_info(self) -> Dict[str, Any]:
        """Get current dual-engine model information and status."""
        vram = "N/A"
        if torch.cuda.is_available():
            vram = f"{torch.cuda.memory_allocated() / 1024**3:.2f}"

        return {
            "architecture": "dual-engine",
            "engine1": {
                "model": "Gemma-2-9b-it",
                "role": "Analysis (POST /analyze)",
                "adapter": self._current_adapter,
                "lora_active": self._lora_applied,
            },
            "engine2": {
                "model": "Meta-Llama-3.1-8B-Instruct",
                "role": "Chat (POST /chat)",
                "adapter": None,
                "lora_active": False,
            },
            "initialized": self._initialized,
            "device": self._device,
            "quantization": "4-bit NF4 (both engines)",
            "vram_allocated_gb": vram,
        }

    def _load_existing_adapter(self) -> None:
        """Load most recently saved LoRA adapter if exists (Gemma only)."""
        adapter_path = Path(settings.LORA_ADAPTER_PATH)
        adapter_path.mkdir(parents=True, exist_ok=True)
        adapters = list(adapter_path.glob("*/adapter_config.json"))
        if adapters:
            latest = max(adapters, key=lambda p: p.stat().st_mtime).parent
            try:
                self._gemma_model = PeftModel.from_pretrained(
                    self._gemma_model.base_model.model, str(latest)
                )
                self._current_adapter = str(latest)
                logger.info("Loaded existing adapter", path=str(latest))
            except Exception as e:
                logger.warning(f"Failed to load adapter: {e}")


# ============================================================================
#                           SINGLETON INSTANCE
# ============================================================================

model_engine = ModelEngine()
