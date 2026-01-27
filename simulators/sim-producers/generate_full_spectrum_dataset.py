#!/usr/bin/env python3
"""
================================================================================
        C4ISR FULL-SPECTRUM TRAINING DATA GENERATOR
================================================================================
    ███████╗██╗███╗   ██╗ █████╗ ██████╗ ███████╗
    ██╔════╝██║████╗  ██║██╔══██╗██╔══██╗██╔════╝
    ███████╗██║██╔██╗ ██║███████║██████╔╝███████╗
    ╚════██║██║██║╚██╗██║██╔══██║██╔═══╝ ╚════██║
    ███████║██║██║ ╚████║██║  ██║██║     ███████║
    ╚══════╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝     ╚══════╝

    TRAINING DATA GENERATION FOR GEMMA-9B FINE-TUNING
    
    Generates a massive, highly realistic dataset covering:
    - Soldier, Drone, and Vehicle operations
    - Routine, Stress, and Crisis phases
    - Multiple scenarios per entity type
    
    Output: real_world_train_data.jsonl
    
    Distribution:
    - 60% Routine scenarios (LOW threat)
    - 30% Stress scenarios (MEDIUM threat)
    - 10% Crisis scenarios (HIGH/CRITICAL threat)
    
================================================================================
"""

import json
import random
import argparse
import pathlib
import sys
from datetime import datetime
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass

# Add parent directory for imports
script_dir = pathlib.Path(__file__).parent
sys.path.insert(0, str(script_dir))

from sim_utils import (
    EntityType, ScenarioCategory, ScenarioLibrary,
    GroundTruthGenerator, NoiseInjector
)
from soldier_sim import SoldierSim
from drone_sim import DroneSim
from vehicle_sim import VehicleSim


# ============================================================================
#                           CONFIGURATION
# ============================================================================

@dataclass
class GeneratorConfig:
    """Configuration for dataset generation."""
    total_samples: int = 10000
    output_file: str = "real_world_train_data.jsonl"
    
    # Distribution percentages (must sum to 1.0)
    routine_pct: float = 0.60
    stress_pct: float = 0.30
    crisis_pct: float = 0.10
    
    # Entity distribution (must sum to 1.0)
    soldier_pct: float = 0.35
    drone_pct: float = 0.35
    vehicle_pct: float = 0.30
    
    # Noise settings
    apply_noise: bool = True
    
    # Verbosity
    progress_interval: int = 500
    verbose: bool = True
    
    def validate(self):
        """Validate configuration values."""
        assert abs(self.routine_pct + self.stress_pct + self.crisis_pct - 1.0) < 0.001, \
            "Category percentages must sum to 1.0"
        assert abs(self.soldier_pct + self.drone_pct + self.vehicle_pct - 1.0) < 0.001, \
            "Entity percentages must sum to 1.0"


# ============================================================================
#                           MAIN GENERATOR CLASS
# ============================================================================

class FullSpectrumGenerator:
    """
    Master generator for full-spectrum C4ISR training data.
    
    Creates a balanced, realistic dataset with proper distribution
    of entity types and scenario categories.
    """
    
    def __init__(self, config: GeneratorConfig):
        self.config = config
        self.config.validate()
        
        # Initialize simulators with minimal config (no MQTT)
        self.soldier_sim = SoldierSim({"broker": {}, "soldier": {}})
        self.drone_sim = DroneSim({"broker": {}, "uav": {}})
        self.vehicle_sim = VehicleSim({"broker": {}, "vehicle": {}})
        
        # Pre-load scenario lists for each entity type
        self.scenarios = {
            EntityType.SOLDIER: {
                ScenarioCategory.ROUTINE: ScenarioLibrary.get_scenarios_by_category(
                    EntityType.SOLDIER, ScenarioCategory.ROUTINE),
                ScenarioCategory.STRESS: ScenarioLibrary.get_scenarios_by_category(
                    EntityType.SOLDIER, ScenarioCategory.STRESS),
                ScenarioCategory.CRISIS: ScenarioLibrary.get_scenarios_by_category(
                    EntityType.SOLDIER, ScenarioCategory.CRISIS),
            },
            EntityType.DRONE: {
                ScenarioCategory.ROUTINE: ScenarioLibrary.get_scenarios_by_category(
                    EntityType.DRONE, ScenarioCategory.ROUTINE),
                ScenarioCategory.STRESS: ScenarioLibrary.get_scenarios_by_category(
                    EntityType.DRONE, ScenarioCategory.STRESS),
                ScenarioCategory.CRISIS: ScenarioLibrary.get_scenarios_by_category(
                    EntityType.DRONE, ScenarioCategory.CRISIS),
            },
            EntityType.VEHICLE: {
                ScenarioCategory.ROUTINE: ScenarioLibrary.get_scenarios_by_category(
                    EntityType.VEHICLE, ScenarioCategory.ROUTINE),
                ScenarioCategory.STRESS: ScenarioLibrary.get_scenarios_by_category(
                    EntityType.VEHICLE, ScenarioCategory.STRESS),
                ScenarioCategory.CRISIS: ScenarioLibrary.get_scenarios_by_category(
                    EntityType.VEHICLE, ScenarioCategory.CRISIS),
            },
        }
        
        # Statistics tracking
        self.stats = {
            "total_generated": 0,
            "by_entity": {e.value: 0 for e in EntityType},
            "by_category": {c.value: 0 for c in ScenarioCategory},
            "by_scenario": {}
        }
    
    def _select_entity_type(self) -> EntityType:
        """Select entity type based on configured distribution."""
        rand = random.random()
        if rand < self.config.soldier_pct:
            return EntityType.SOLDIER
        elif rand < self.config.soldier_pct + self.config.drone_pct:
            return EntityType.DRONE
        else:
            return EntityType.VEHICLE
    
    def _select_category(self) -> ScenarioCategory:
        """Select scenario category based on configured distribution."""
        rand = random.random()
        if rand < self.config.routine_pct:
            return ScenarioCategory.ROUTINE
        elif rand < self.config.routine_pct + self.config.stress_pct:
            return ScenarioCategory.STRESS
        else:
            return ScenarioCategory.CRISIS
    
    def _select_scenario(self, entity_type: EntityType, category: ScenarioCategory) -> str:
        """Select a specific scenario from the given entity and category."""
        scenario_list = self.scenarios[entity_type][category]
        if not scenario_list:
            raise ValueError(f"No scenarios found for {entity_type} / {category}")
        return random.choice(scenario_list)
    
    def _generate_sample(self, entity_type: EntityType, scenario_name: str) -> Dict:
        """Generate a single training sample."""
        if entity_type == EntityType.SOLDIER:
            telemetry, label = self.soldier_sim.generate_training_data(
                scenario_name, apply_noise=self.config.apply_noise)
        elif entity_type == EntityType.DRONE:
            telemetry, label = self.drone_sim.generate_training_data(
                scenario_name, apply_noise=self.config.apply_noise)
        else:
            telemetry, label = self.vehicle_sim.generate_training_data(
                scenario_name, apply_noise=self.config.apply_noise)
        
        return {
            "telemetry": telemetry,
            "label": label,
            "metadata": {
                "entity_type": entity_type.value,
                "scenario_name": scenario_name,
                "generated_at": datetime.utcnow().isoformat()
            }
        }
    
    def _format_for_training(self, sample: Dict) -> Dict:
        """
        Format sample for LLM fine-tuning.
        Creates instruction-response pairs suitable for SFT.
        """
        telemetry = sample["telemetry"]
        label = sample["label"]
        
        # Build the instruction prompt
        entity_type = sample["metadata"]["entity_type"].upper()
        
        instruction = f"""Analyze the following {entity_type} telemetry data and provide a tactical assessment.

TELEMETRY DATA:
{json.dumps(telemetry, indent=2)}

Provide your analysis in the following JSON format:
{{
    "threat_level": "LOW|MEDIUM|HIGH|CRITICAL",
    "decision": "Your tactical decision",
    "reasoning": "Detailed reasoning for your assessment",
    "confidence": 0.0-1.0
}}"""
        
        # Build the response
        response = json.dumps({
            "threat_level": label["threat_level"],
            "decision": label["decision"],
            "reasoning": label["reasoning"],
            "confidence": label["confidence"]
        }, indent=2)
        
        return {
            "instruction": instruction,
            "input": "",  # Context already included in instruction
            "output": response,
            "metadata": sample["metadata"]
        }
    
    def generate_dataset(self, output_path: Optional[str] = None) -> str:
        """
        Generate the full training dataset.
        
        Returns:
            Path to the generated file
        """
        output_file = pathlib.Path(output_path or self.config.output_file)
        
        print("=" * 70)
        print("  C4ISR FULL-SPECTRUM TRAINING DATA GENERATOR")
        print("=" * 70)
        print(f"  Target samples: {self.config.total_samples:,}")
        print(f"  Output file: {output_file}")
        print(f"  Distribution: {self.config.routine_pct*100:.0f}% Routine, "
              f"{self.config.stress_pct*100:.0f}% Stress, "
              f"{self.config.crisis_pct*100:.0f}% Crisis")
        print(f"  Entity mix: {self.config.soldier_pct*100:.0f}% Soldier, "
              f"{self.config.drone_pct*100:.0f}% Drone, "
              f"{self.config.vehicle_pct*100:.0f}% Vehicle")
        print("=" * 70)
        print()
        
        start_time = datetime.now()
        
        with open(output_file, 'w', encoding='utf-8') as f:
            for i in range(self.config.total_samples):
                try:
                    # 1. Select entity type
                    entity_type = self._select_entity_type()
                    
                    # 2. Select scenario category
                    category = self._select_category()
                    
                    # 3. Select specific scenario
                    scenario_name = self._select_scenario(entity_type, category)
                    
                    # 4. Generate sample
                    sample = self._generate_sample(entity_type, scenario_name)
                    
                    # 5. Format for training
                    training_sample = self._format_for_training(sample)
                    
                    # 6. Write to file
                    f.write(json.dumps(training_sample, ensure_ascii=False) + '\n')
                    
                    # 7. Update statistics
                    self.stats["total_generated"] += 1
                    self.stats["by_entity"][entity_type.value] += 1
                    self.stats["by_category"][category.value] += 1
                    self.stats["by_scenario"][scenario_name] = \
                        self.stats["by_scenario"].get(scenario_name, 0) + 1
                    
                    # 8. Progress update
                    if self.config.verbose and (i + 1) % self.config.progress_interval == 0:
                        elapsed = (datetime.now() - start_time).total_seconds()
                        rate = (i + 1) / elapsed
                        remaining = (self.config.total_samples - i - 1) / rate
                        print(f"  Progress: {i+1:,}/{self.config.total_samples:,} "
                              f"({(i+1)/self.config.total_samples*100:.1f}%) "
                              f"| Rate: {rate:.1f}/s "
                              f"| ETA: {remaining:.0f}s")
                
                except Exception as e:
                    print(f"  [ERROR] Sample {i}: {e}")
                    continue
        
        # Generation complete
        elapsed = (datetime.now() - start_time).total_seconds()
        
        print()
        print("=" * 70)
        print("  GENERATION COMPLETE!")
        print("=" * 70)
        print(f"  Total samples: {self.stats['total_generated']:,}")
        print(f"  Time elapsed: {elapsed:.1f}s")
        print(f"  Rate: {self.stats['total_generated']/elapsed:.1f} samples/second")
        print()
        print("  Entity Distribution:")
        for entity, count in self.stats["by_entity"].items():
            pct = count / self.stats["total_generated"] * 100
            print(f"    {entity:>10}: {count:>6,} ({pct:.1f}%)")
        print()
        print("  Category Distribution:")
        for cat, count in self.stats["by_category"].items():
            pct = count / self.stats["total_generated"] * 100
            print(f"    {cat:>10}: {count:>6,} ({pct:.1f}%)")
        print()
        print("  Top Scenarios:")
        sorted_scenarios = sorted(self.stats["by_scenario"].items(), 
                                  key=lambda x: x[1], reverse=True)[:10]
        for scenario, count in sorted_scenarios:
            pct = count / self.stats["total_generated"] * 100
            print(f"    {scenario:>25}: {count:>5,} ({pct:.1f}%)")
        print()
        print(f"  Output: {output_file.absolute()}")
        print("=" * 70)
        
        return str(output_file.absolute())
    
    def get_stats(self) -> Dict:
        """Return generation statistics."""
        return self.stats


# ============================================================================
#                           CLI INTERFACE
# ============================================================================

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Generate full-spectrum C4ISR training data for AI fine-tuning",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate default 10,000 samples
  python generate_full_spectrum_dataset.py
  
  # Generate 50,000 samples to custom file
  python generate_full_spectrum_dataset.py --samples 50000 --output my_data.jsonl
  
  # Adjust distribution (more crisis scenarios for testing)
  python generate_full_spectrum_dataset.py --routine 0.4 --stress 0.3 --crisis 0.3
  
  # Fast generation without noise for testing
  python generate_full_spectrum_dataset.py --samples 1000 --no-noise
        """
    )
    
    parser.add_argument("--samples", "-n", type=int, default=10000,
                        help="Number of samples to generate (default: 10000)")
    parser.add_argument("--output", "-o", type=str, default="real_world_train_data.jsonl",
                        help="Output file path (default: real_world_train_data.jsonl)")
    
    # Distribution settings
    parser.add_argument("--routine", type=float, default=0.60,
                        help="Routine scenario percentage (default: 0.60)")
    parser.add_argument("--stress", type=float, default=0.30,
                        help="Stress scenario percentage (default: 0.30)")
    parser.add_argument("--crisis", type=float, default=0.10,
                        help="Crisis scenario percentage (default: 0.10)")
    
    # Entity distribution
    parser.add_argument("--soldier-pct", type=float, default=0.35,
                        help="Soldier entity percentage (default: 0.35)")
    parser.add_argument("--drone-pct", type=float, default=0.35,
                        help="Drone entity percentage (default: 0.35)")
    parser.add_argument("--vehicle-pct", type=float, default=0.30,
                        help="Vehicle entity percentage (default: 0.30)")
    
    # Generation settings
    parser.add_argument("--no-noise", action="store_true",
                        help="Disable sensor noise injection")
    parser.add_argument("--quiet", "-q", action="store_true",
                        help="Suppress progress output")
    parser.add_argument("--progress-interval", type=int, default=500,
                        help="Progress update interval (default: 500)")
    
    # Validation mode
    parser.add_argument("--validate-only", action="store_true",
                        help="Just validate configuration without generating")
    parser.add_argument("--list-scenarios", action="store_true",
                        help="List all available scenarios")
    
    return parser.parse_args()


def list_scenarios():
    """Print all available scenarios."""
    print("\n" + "=" * 70)
    print("  AVAILABLE SCENARIOS")
    print("=" * 70)
    
    for entity_type in EntityType:
        print(f"\n  [{entity_type.value.upper()}]")
        
        for category in ScenarioCategory:
            scenarios = ScenarioLibrary.get_scenarios_by_category(entity_type, category)
            if scenarios:
                print(f"    {category.value.upper()}:")
                for s in scenarios:
                    scenario_data = ScenarioLibrary.get_scenario(entity_type, s)
                    desc = scenario_data.get("description", "")[:50]
                    print(f"      - {s}: {desc}")
    
    print()


def main():
    """Main entry point."""
    args = parse_args()
    
    # Handle special modes
    if args.list_scenarios:
        list_scenarios()
        return 0
    
    # Build configuration
    config = GeneratorConfig(
        total_samples=args.samples,
        output_file=args.output,
        routine_pct=args.routine,
        stress_pct=args.stress,
        crisis_pct=args.crisis,
        soldier_pct=args.soldier_pct,
        drone_pct=args.drone_pct,
        vehicle_pct=args.vehicle_pct,
        apply_noise=not args.no_noise,
        verbose=not args.quiet,
        progress_interval=args.progress_interval
    )
    
    # Validate configuration
    try:
        config.validate()
    except AssertionError as e:
        print(f"[ERROR] Invalid configuration: {e}")
        return 1
    
    if args.validate_only:
        print("[OK] Configuration is valid")
        return 0
    
    # Generate dataset
    generator = FullSpectrumGenerator(config)
    
    try:
        output_path = generator.generate_dataset()
        print(f"\n✅ Dataset generated successfully: {output_path}")
        return 0
    except Exception as e:
        print(f"\n❌ Generation failed: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
