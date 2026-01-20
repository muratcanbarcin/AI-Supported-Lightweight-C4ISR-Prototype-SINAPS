"""
Model Engine - LLM Management with LoRA Fine-tuning
============================================================================
SECURITY: OFFLINE MODE - Model loaded from local directory only.
           No external network calls to HuggingFace or any API permitted.
============================================================================
Handles: Gemma-2-2b-it with 4-bit quantization, LoRA adapters, tactical decisions
"""
import os, time, torch
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime
from pathlib import Path
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig, TrainingArguments, Trainer
from peft import LoraConfig, get_peft_model, PeftModel, prepare_model_for_kbit_training, TaskType
from datasets import Dataset
import structlog
from config.settings import settings
from schemas.telemetry import ThreatLevel

logger = structlog.get_logger(__name__)

# Offline model path - NO INTERNET ACCESS
LOCAL_LLM_MODEL_PATH = Path("./local_models/llm")

TACTICAL_SYSTEM_PROMPT = """You are a C4ISR AI tactical advisor. Analyze telemetry and provide:
1. THREAT LEVEL: (CRITICAL/HIGH/MEDIUM/LOW/MINIMAL/UNKNOWN)
2. DECISION: Actionable tactical recommendation
3. REASONING: Brief explanation"""

class ModelEngine:
    def __init__(self):
        self._model = None
        self._tokenizer = None
        self._initialized = False
        self._lora_applied = False
        self._current_adapter: Optional[str] = None
        self._training_jobs: Dict[str, Dict] = {}
    
    def initialize(self) -> None:
        """Initialize model from LOCAL directory (air-gapped mode)"""
        if self._initialized: return
        
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
        logger.info("Loading LLM from LOCAL directory (OFFLINE MODE)", model_path=model_path)
        
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True, bnb_4bit_use_double_quant=True,
            bnb_4bit_quant_type=settings.BNB_4BIT_QUANT_TYPE,
            bnb_4bit_compute_dtype=getattr(torch, settings.BNB_4BIT_COMPUTE_DTYPE))
        
        # Load tokenizer from LOCAL path - NO NETWORK CALLS
        self._tokenizer = AutoTokenizer.from_pretrained(
            model_path, local_files_only=True, trust_remote_code=True)
        if self._tokenizer.pad_token is None:
            self._tokenizer.pad_token = self._tokenizer.eos_token
        
        # Load model from LOCAL path - NO NETWORK CALLS
        self._model = AutoModelForCausalLM.from_pretrained(
            model_path, quantization_config=bnb_config, device_map="auto",
            local_files_only=True, trust_remote_code=True)
        self._model = prepare_model_for_kbit_training(self._model)
        self._apply_lora_config()
        self._initialized = True
        self._load_existing_adapter()
    
    def _apply_lora_config(self):
        lora_config = LoraConfig(
            r=settings.LORA_RANK, lora_alpha=settings.LORA_ALPHA, lora_dropout=settings.LORA_DROPOUT,
            bias="none", task_type=TaskType.CAUSAL_LM,
            target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"])
        self._model = get_peft_model(self._model, lora_config)
        self._lora_applied = True
    
    def _load_existing_adapter(self):
        adapter_path = Path(settings.LORA_ADAPTER_PATH)
        adapter_path.mkdir(parents=True, exist_ok=True)
        adapters = list(adapter_path.glob("*/adapter_config.json"))
        if adapters:
            latest = max(adapters, key=lambda p: p.stat().st_mtime).parent
            try:
                self._model = PeftModel.from_pretrained(self._model.base_model.model, str(latest))
                self._current_adapter = str(latest)
            except: pass
    
    def generate_decision(self, telemetry_json: Dict, retrieved_context: List[Dict], max_new_tokens: int = 512) -> Tuple[str, ThreatLevel, float, str]:
        if not self._initialized: raise RuntimeError("Model not initialized")
        start = time.time()
        prompt = self._build_prompt(telemetry_json, retrieved_context)
        inputs = self._tokenizer(prompt, return_tensors="pt", truncation=True, max_length=2048).to(self._model.device)
        with torch.no_grad():
            outputs = self._model.generate(**inputs, max_new_tokens=max_new_tokens, do_sample=True,
                temperature=0.7, top_p=0.9, pad_token_id=self._tokenizer.pad_token_id)
        text = self._tokenizer.decode(outputs[0][inputs['input_ids'].shape[1]:], skip_special_tokens=True)
        return self._parse_response(text)
    
    def _build_prompt(self, telemetry: Dict, context: List[Dict]) -> str:
        ctx = "\n".join([f"Event {i+1}: {c.get('event_description','')} -> {c.get('outcome','')}" for i,c in enumerate(context)]) if context else "No historical context"
        tel = "\n".join([f"- {k}: {v}" for k,v in telemetry.items() if v])
        msgs = [{"role":"user","content":f"{TACTICAL_SYSTEM_PROMPT}\n\nContext:\n{ctx}\n\nCurrent:\n{tel}\n\nProvide: THREAT LEVEL, DECISION, REASONING"}]
        return self._tokenizer.apply_chat_template(msgs, tokenize=False, add_generation_prompt=True)
    
    def _parse_response(self, response: str) -> Tuple[str, ThreatLevel, float, str]:
        decision, threat, conf, reason = response, ThreatLevel.UNKNOWN, 0.5, ""
        for line in response.split('\n'):
            l = line.strip().upper()
            if l.startswith("THREAT LEVEL:"): 
                for t in ThreatLevel:
                    if t.value in l: threat = t; conf = {ThreatLevel.CRITICAL:0.95,ThreatLevel.HIGH:0.85,ThreatLevel.MEDIUM:0.75}.get(t,0.7); break
            elif l.startswith("DECISION:"): decision = line.split(":",1)[1].strip()
            elif l.startswith("REASONING:"): reason = line.split(":",1)[1].strip()
        return decision, threat, conf, reason
    
    def train_lora(self, training_examples: List[Dict], epochs: int=3, learning_rate: float=2e-4, batch_size: int=4, adapter_name: str="tactical_adapter") -> str:
        if not self._initialized: raise RuntimeError("Model not initialized")
        job_id = f"train_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self._training_jobs[job_id] = {'status':'RUNNING','started_at':datetime.utcnow(),'progress':0}
        try:
            data = [{"text":f"### Instruction:\n{e['instruction']}\n### Input:\n{e['input_data']}\n### Response:\n{e['output']}"} for e in training_examples]
            dataset = Dataset.from_list(data).map(lambda x: self._tokenizer(x["text"],truncation=True,max_length=1024,padding="max_length"), batched=True)
            path = os.path.join(settings.LORA_ADAPTER_PATH, adapter_name)
            args = TrainingArguments(output_dir=path,num_train_epochs=epochs,per_device_train_batch_size=batch_size,
                learning_rate=learning_rate,save_strategy="epoch",optim="paged_adamw_8bit",fp16=True,report_to="none")
            Trainer(model=self._model,args=args,train_dataset=dataset).train()
            self._model.save_pretrained(path)
            self._training_jobs[job_id].update({'status':'COMPLETED','progress':100,'adapter_path':path})
        except Exception as e:
            self._training_jobs[job_id].update({'status':'FAILED','error':str(e)})
            raise
        return job_id
    
    def get_training_status(self, job_id: str) -> Optional[Dict]: return self._training_jobs.get(job_id)
    def get_model_info(self) -> Dict: return {"model":settings.MODEL_NAME,"initialized":self._initialized,"adapter":self._current_adapter}

model_engine = ModelEngine()
