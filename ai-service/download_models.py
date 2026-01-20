#!/usr/bin/env python3
"""
============================================================================
C4ISR AI Microservice - Offline Model Download Script
============================================================================
PURPOSE: Run this script ONCE on a machine WITH internet access to download
         all required models for offline/air-gapped deployment.

MODELS DOWNLOADED:
  - google/gemma-2-9b-it       -> ./local_models/llm      (~18GB download)
  - all-MiniLM-L6-v2           -> ./local_models/embedding (~90MB download)

TARGET HARDWARE:
  - GPU: NVIDIA RTX 3080 (16GB VRAM) or equivalent
  - RAM: 32GB system memory
  - Disk: ~25GB free space for model storage

USAGE:
  1. Set HF_TOKEN environment variable (required for Gemma)
  2. Run: python download_models.py
  3. Transfer the ./local_models folder to the secure environment

SECURITY NOTE:
  After transfer, the target system requires NO internet connectivity.
  Model will be loaded in 4-bit quantization (~6-7GB VRAM at runtime).
============================================================================
"""

import os
import sys
from pathlib import Path

# Check for required packages before importing
try:
    from huggingface_hub import snapshot_download, login
    from sentence_transformers import SentenceTransformer
except ImportError as e:
    print(f"ERROR: Missing required package: {e}")
    print("Install with: pip install huggingface_hub sentence-transformers")
    sys.exit(1)


# Configuration - UPGRADED TO 9B MODEL FOR RTX 3080 16GB
LOCAL_MODELS_DIR = Path("./local_models")
LLM_MODEL_NAME = "google/gemma-2-9b-it"  # 9B parameters, ~18GB download
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

LLM_LOCAL_PATH = LOCAL_MODELS_DIR / "llm"
EMBEDDING_LOCAL_PATH = LOCAL_MODELS_DIR / "embedding"


def check_hf_token():
    """Verify HuggingFace token is available (required for Gemma)"""
    token = "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"
    if not token:
        print("=" * 60)
        print("ERROR: HF_TOKEN environment variable not set!")
        print()
        print("Gemma model requires authentication. Get your token from:")
        print("  https://huggingface.co/settings/tokens")
        print()
        print("You must also accept the model license at:")
        print("  https://huggingface.co/google/gemma-2-2b-it")
        print()
        print("Set token: export HF_TOKEN=your_token_here")
        print("=" * 60)
        sys.exit(1)
    return token


def download_llm_model(token: str):
    """Download the Gemma LLM model with all required files"""
    print(f"\n{'='*60}")
    print(f"Downloading LLM: {LLM_MODEL_NAME}")
    print(f"Destination: {LLM_LOCAL_PATH.absolute()}")
    print("=" * 60)
    
    # Login to HuggingFace
    login(token=token)
    
    # Create directory
    LLM_LOCAL_PATH.mkdir(parents=True, exist_ok=True)
    
    # Download complete model snapshot
    # This includes: config.json, tokenizer files, model weights, etc.
    snapshot_download(
        repo_id=LLM_MODEL_NAME,
        local_dir=str(LLM_LOCAL_PATH),
        local_dir_use_symlinks=False,  # Copy files, don't symlink
        token=token,
        ignore_patterns=["*.md", "*.txt"],  # Skip documentation
    )
    
    print(f"✓ LLM model downloaded to: {LLM_LOCAL_PATH.absolute()}")
    
    # Verify essential files exist
    essential_files = ["config.json", "tokenizer.json", "tokenizer_config.json"]
    for f in essential_files:
        if not (LLM_LOCAL_PATH / f).exists():
            print(f"  WARNING: {f} not found - model may not load correctly")
        else:
            print(f"  ✓ {f} present")


def download_embedding_model():
    """Download the SentenceTransformer embedding model"""
    print(f"\n{'='*60}")
    print(f"Downloading Embedding Model: {EMBEDDING_MODEL_NAME}")
    print(f"Destination: {EMBEDDING_LOCAL_PATH.absolute()}")
    print("=" * 60)
    
    # Create directory
    EMBEDDING_LOCAL_PATH.mkdir(parents=True, exist_ok=True)
    
    # Download using snapshot_download for complete model
    snapshot_download(
        repo_id=EMBEDDING_MODEL_NAME,
        local_dir=str(EMBEDDING_LOCAL_PATH),
        local_dir_use_symlinks=False,
        ignore_patterns=["*.md", "*.txt"],
    )
    
    # Also save using SentenceTransformer to ensure proper format
    print("Verifying model loads correctly...")
    model = SentenceTransformer(str(EMBEDDING_LOCAL_PATH))
    
    # Test embedding generation
    test_embedding = model.encode("Test tactical situation", convert_to_numpy=True)
    print(f"  ✓ Embedding dimension: {len(test_embedding)}")
    print(f"✓ Embedding model downloaded to: {EMBEDDING_LOCAL_PATH.absolute()}")


def verify_downloads():
    """Verify all models are downloaded correctly"""
    print(f"\n{'='*60}")
    print("VERIFICATION")
    print("=" * 60)
    
    errors = []
    
    # Check LLM
    if not LLM_LOCAL_PATH.exists():
        errors.append(f"LLM directory missing: {LLM_LOCAL_PATH}")
    elif not (LLM_LOCAL_PATH / "config.json").exists():
        errors.append("LLM config.json missing")
    else:
        print(f"✓ LLM model ready at: {LLM_LOCAL_PATH.absolute()}")
    
    # Check Embedding
    if not EMBEDDING_LOCAL_PATH.exists():
        errors.append(f"Embedding directory missing: {EMBEDDING_LOCAL_PATH}")
    elif not (EMBEDDING_LOCAL_PATH / "config.json").exists():
        errors.append("Embedding config.json missing")
    else:
        print(f"✓ Embedding model ready at: {EMBEDDING_LOCAL_PATH.absolute()}")
    
    if errors:
        print("\nERRORS:")
        for e in errors:
            print(f"  ✗ {e}")
        return False
    
    print(f"\n{'='*60}")
    print("SUCCESS! Models ready for air-gapped deployment.")
    print()
    print("Model specifications:")
    print("  • LLM: Gemma-2-9b-it (~18GB on disk, ~6-7GB VRAM with 4-bit)")
    print("  • Embedding: all-MiniLM-L6-v2 (~90MB)")
    print()
    print("Next steps:")
    print("  1. Copy the entire 'local_models' folder to secure environment")
    print("  2. Ensure folder structure is preserved:")
    print(f"       {LOCAL_MODELS_DIR}/")
    print("         ├── llm/       (~18GB)")
    print("         └── embedding/ (~90MB)")
    print("  3. Start the AI service - it will load models offline")
    print("  4. Verify GPU: nvidia-smi should show ~6-7GB VRAM usage")
    print("=" * 60)
    return True


def main():
    print("=" * 60)
    print("C4ISR AI Microservice - Offline Model Downloader")
    print("=" * 60)
    print()
    print("This script downloads models for air-gapped deployment.")
    print("Internet access is required ONLY for this download step.")
    print()
    
    # Check token
    token = check_hf_token()
    
    # Download models
    try:
        download_llm_model(token)
        download_embedding_model()
        verify_downloads()
    except Exception as e:
        print(f"\nERROR during download: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
