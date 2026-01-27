"""
================================================================================
        C4ISR FULL-SPECTRUM SIMULATION UTILITIES
================================================================================
    ███████╗██╗███╗   ██╗ █████╗ ██████╗ ███████╗
    ██╔════╝██║████╗  ██║██╔══██╗██╔══██╗██╔════╝
    ███████╗██║██╔██╗ ██║███████║██████╔╝███████╗
    ╚════██║██║██║╚██╗██║██╔══██║██╔═══╝ ╚════██║
    ███████║██║██║ ╚████║██║  ██║██║     ███████║
    ╚══════╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝     ╚══════╝

    SIMULATION UTILITIES FOR MULTI-DOMAIN TRAINING DATA GENERATION
    
    Contains:
    - ScenarioLibrary: Physics parameters for all entity types and scenarios
    - GroundTruthGenerator: Label generation based on scenario type
    - NoiseInjector: Realistic sensor noise and data dropout simulation
    
================================================================================
"""

import random
import math
from enum import Enum
from dataclasses import dataclass, field
from typing import Dict, Any, Optional, Tuple, List


# ============================================================================
#                           ENUMERATIONS
# ============================================================================

class EntityType(Enum):
    SOLDIER = "soldier"
    DRONE = "drone"
    VEHICLE = "vehicle"

class ScenarioCategory(Enum):
    ROUTINE = "routine"
    STRESS = "stress"
    CRISIS = "crisis"

class ThreatLevel(Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"
    UNKNOWN = "UNKNOWN"


# ============================================================================
#                           SCENARIO LIBRARY
# ============================================================================

class ScenarioLibrary:
    """
    Comprehensive physics and ground-truth definitions for all entities.
    Each scenario defines:
    - category: ROUTINE / STRESS / CRISIS
    - vitals/telemetry ranges
    - expected threat level
    - decision template
    - reasoning template
    """
    
    SCENARIOS = {
        # =====================================================================
        # SOLDIER SCENARIOS
        # =====================================================================
        EntityType.SOLDIER: {
            # --- ROUTINE SCENARIOS (LOW threat) ---
            "BARRACKS_REST": {
                "category": ScenarioCategory.ROUTINE,
                "description": "Soldier resting in barracks",
                "vitals": {
                    "hr_bpm": (55, 70),          # Low resting heart rate
                    "spo2": (97.0, 100.0),        # Excellent oxygen
                    "resp_bpm": (12, 16),         # Normal breathing
                    "skin_temp_c": (36.0, 36.8),  # Normal temp
                    "stress_index": (0.0, 0.15)   # Very low stress
                },
                "speed_kph": (0, 0),              # Stationary
                "threat_level": ThreatLevel.LOW,
                "decision": "Continue rest cycle. No intervention required.",
                "reasoning": "All vitals within normal resting parameters. Soldier is in secure location."
            },
            "GUARD_DUTY": {
                "category": ScenarioCategory.ROUTINE,
                "description": "Soldier on stationary guard duty",
                "vitals": {
                    "hr_bpm": (65, 80),
                    "spo2": (96.0, 100.0),
                    "resp_bpm": (14, 18),
                    "skin_temp_c": (36.0, 37.0),
                    "stress_index": (0.1, 0.25)
                },
                "speed_kph": (0, 0.5),            # Nearly stationary
                "threat_level": ThreatLevel.LOW,
                "decision": "Maintain guard position. Status normal.",
                "reasoning": "Vitals consistent with alert but relaxed state. Position stable."
            },
            "ROUTINE_PATROL": {
                "category": ScenarioCategory.ROUTINE,
                "description": "Walking patrol in secured area",
                "vitals": {
                    "hr_bpm": (75, 95),
                    "spo2": (95.0, 99.0),
                    "resp_bpm": (16, 22),
                    "skin_temp_c": (36.2, 37.2),
                    "stress_index": (0.15, 0.30)
                },
                "speed_kph": (3.0, 5.5),          # Normal walking pace
                "threat_level": ThreatLevel.LOW,
                "decision": "Continue patrol route. No anomalies detected.",
                "reasoning": "Walking pace and vitals indicate normal patrol activity."
            },
            "MESS_HALL": {
                "category": ScenarioCategory.ROUTINE,
                "description": "Soldier at mess hall eating",
                "vitals": {
                    "hr_bpm": (60, 80),
                    "spo2": (96.0, 100.0),
                    "resp_bpm": (12, 16),
                    "skin_temp_c": (36.0, 37.0),
                    "stress_index": (0.05, 0.20)
                },
                "speed_kph": (0, 1.0),
                "threat_level": ThreatLevel.LOW,
                "decision": "No action required. Routine activity.",
                "reasoning": "Soldier is in mess facility. Vitals normal for sedentary activity."
            },
            
            # --- STRESS SCENARIOS (MEDIUM threat) ---
            "FORCED_MARCH": {
                "category": ScenarioCategory.STRESS,
                "description": "Forced march with heavy pack",
                "vitals": {
                    "hr_bpm": (130, 165),         # High sustained HR
                    "spo2": (92.0, 96.0),         # Slightly reduced O2
                    "resp_bpm": (24, 35),         # Elevated breathing
                    "skin_temp_c": (37.0, 38.5),  # Elevated temp
                    "stress_index": (0.5, 0.75)   # High stress
                },
                "speed_kph": (6.0, 8.5),          # Fast march pace
                "threat_level": ThreatLevel.MEDIUM,
                "decision": "Monitor closely. Schedule rest break within 15 minutes.",
                "reasoning": "High cardiac output during forced march. Risk of overexertion if sustained."
            },
            "COLD_WEATHER": {
                "category": ScenarioCategory.STRESS,
                "description": "Operating in extreme cold conditions",
                "vitals": {
                    "hr_bpm": (80, 110),
                    "spo2": (94.0, 98.0),
                    "resp_bpm": (16, 24),
                    "skin_temp_c": (32.0, 35.0),  # Hypothermic risk
                    "stress_index": (0.4, 0.65)
                },
                "speed_kph": (2.0, 4.0),          # Slower in cold
                "threat_level": ThreatLevel.MEDIUM,
                "decision": "Monitor for cold injury. Consider rotation to warming station.",
                "reasoning": "Skin temperature indicates early cold stress. Frostbite risk if not addressed."
            },
            "DEHYDRATION": {
                "category": ScenarioCategory.STRESS,
                "description": "Dehydration during operations",
                "vitals": {
                    "hr_bpm": (100, 130),         # Elevated due to fluid loss
                    "spo2": (94.0, 97.0),
                    "resp_bpm": (20, 28),
                    "skin_temp_c": (37.2, 38.8),  # Hot and dry
                    "stress_index": (0.45, 0.70)
                },
                "speed_kph": (3.0, 5.0),          # Maintaining pace despite condition
                "threat_level": ThreatLevel.MEDIUM,
                "decision": "Initiate hydration protocol. Monitor for heat injury.",
                "reasoning": "Elevated heart rate with normal activity suggests dehydration. Risk of heat stroke."
            },
            "HEAVY_LOAD": {
                "category": ScenarioCategory.STRESS,
                "description": "Carrying excessive equipment load",
                "vitals": {
                    "hr_bpm": (110, 145),
                    "spo2": (93.0, 97.0),
                    "resp_bpm": (22, 32),
                    "skin_temp_c": (37.0, 38.2),
                    "stress_index": (0.5, 0.70)
                },
                "speed_kph": (2.0, 4.0),          # Slow due to load
                "threat_level": ThreatLevel.MEDIUM,
                "decision": "Consider load redistribution. Watch for musculoskeletal stress.",
                "reasoning": "High heart rate at slow speed indicates physical strain from equipment load."
            },
            "SUSTAINED_COMBAT": {
                "category": ScenarioCategory.STRESS,
                "description": "Extended combat engagement",
                "vitals": {
                    "hr_bpm": (140, 175),
                    "spo2": (91.0, 96.0),
                    "resp_bpm": (28, 40),
                    "skin_temp_c": (37.5, 39.0),
                    "stress_index": (0.7, 0.90)
                },
                "speed_kph": (0, 8.0),            # Variable - taking cover or moving
                "threat_level": ThreatLevel.MEDIUM,
                "decision": "Monitor for combat fatigue. Prepare rotation if possible.",
                "reasoning": "Sustained high stress combat indicators. Risk of decision fatigue."
            },
            
            # --- CRISIS SCENARIOS (HIGH/CRITICAL threat) ---
            "GUNSHOT_WOUND": {
                "category": ScenarioCategory.CRISIS,
                "description": "Soldier sustained gunshot wound",
                "vitals": {
                    "hr_bpm": (120, 180),         # Tachycardia from blood loss
                    "spo2": (80.0, 92.0),         # Dropping O2
                    "resp_bpm": (26, 45),         # Rapid shallow breathing
                    "skin_temp_c": (35.0, 36.5),  # Cooling from shock
                    "stress_index": (0.85, 1.0)
                },
                "speed_kph": (0, 0),              # Cannot move
                "threat_level": ThreatLevel.CRITICAL,
                "decision": "MEDEVAC IMMEDIATE! Deploy CASEVAC team. Apply tactical care.",
                "reasoning": "Vital signs consistent with hemorrhagic shock from penetrating trauma. Life-threatening."
            },
            "BLAST_INJURY": {
                "category": ScenarioCategory.CRISIS,
                "description": "IED or explosive blast injury",
                "vitals": {
                    "hr_bpm": (90, 160),          # Variable - may be suppressed
                    "spo2": (75.0, 90.0),         # Blast lung
                    "resp_bpm": (30, 50),
                    "skin_temp_c": (35.0, 37.0),
                    "stress_index": (0.9, 1.0)
                },
                "speed_kph": (0, 0),
                "threat_level": ThreatLevel.CRITICAL,
                "decision": "PRIORITY MEDEVAC! Assess for TBI and internal injuries. Secure airway.",
                "reasoning": "Blast signature detected. High probability of polytrauma including TBI and blast lung."
            },
            "CARDIAC_ARREST": {
                "category": ScenarioCategory.CRISIS,
                "description": "Cardiac arrest event",
                "vitals": {
                    "hr_bpm": (0, 15),            # Absent or very weak pulse (or >200 VFib)
                    "spo2": (0.0, 70.0),          # Critical hypoxia
                    "resp_bpm": (0, 8),           # Agonal or absent
                    "skin_temp_c": (34.0, 36.0),
                    "stress_index": (1.0, 1.0)
                },
                "speed_kph": (0, 0),
                "threat_level": ThreatLevel.CRITICAL,
                "decision": "EMERGENCY! Initiate CPR. Deploy AED. Request immediate MEDEVAC.",
                "reasoning": "CARDIAC ARREST - No pulse detected. Immediate resuscitation required."
            },
            "PANIC_ATTACK": {
                "category": ScenarioCategory.CRISIS,
                "description": "Acute psychological crisis - panic attack",
                "vitals": {
                    "hr_bpm": (150, 200),         # Extreme tachycardia
                    "spo2": (94.0, 99.0),         # Actually OK - hyperventilating
                    "resp_bpm": (35, 60),         # Hyperventilation
                    "skin_temp_c": (36.5, 38.0),
                    "stress_index": (0.95, 1.0)
                },
                "speed_kph": (0, 2.0),            # Erratic or frozen
                "threat_level": ThreatLevel.HIGH,
                "decision": "Psychological crisis! Remove from immediate threat. Initiate combat stress protocol.",
                "reasoning": "Erratic heart rate and hyperventilation without physical cause. Combat stress reaction."
            },
            "HYPOTHERMIA_SEVERE": {
                "category": ScenarioCategory.CRISIS,
                "description": "Severe hypothermia - life threatening",
                "vitals": {
                    "hr_bpm": (30, 55),           # Bradycardia
                    "spo2": (85.0, 94.0),
                    "resp_bpm": (6, 12),          # Slow breathing
                    "skin_temp_c": (28.0, 32.0),  # Severe hypothermia
                    "stress_index": (0.3, 0.6)    # Paradoxically low - confusion
                },
                "speed_kph": (0, 1.0),
                "threat_level": ThreatLevel.CRITICAL,
                "decision": "CRITICAL COLD INJURY! Initiate warming protocol. MEDEVAC priority.",
                "reasoning": "Core temperature in critical range. Risk of cardiac arrhythmia and organ failure."
            }
        },
        
        # =====================================================================
        # DRONE SCENARIOS
        # =====================================================================
        EntityType.DRONE: {
            # --- ROUTINE SCENARIOS ---
            "WAYPOINT_MISSION": {
                "category": ScenarioCategory.ROUTINE,
                "description": "Standard waypoint navigation mission",
                "telemetry": {
                    "altitude_m": (80, 150),
                    "speed_mps": (10, 18),
                    "battery_pct": (40, 95),
                    "mode": "AUTO"
                },
                "threat_level": ThreatLevel.LOW,
                "decision": "Mission proceeding normally. Continue current flight plan.",
                "reasoning": "All telemetry within operational parameters. Battery adequate for mission completion."
            },
            "HOVER_WATCH": {
                "category": ScenarioCategory.ROUTINE,
                "description": "Stationary observation hover",
                "telemetry": {
                    "altitude_m": (50, 120),
                    "speed_mps": (0, 2),          # Hovering with minor drift
                    "battery_pct": (35, 90),
                    "mode": "LOITER"
                },
                "threat_level": ThreatLevel.LOW,
                "decision": "Maintaining observation position. Data link stable.",
                "reasoning": "Stationary hover normal for ISR mission. Battery consumption nominal."
            },
            "RTH_STANDARD": {
                "category": ScenarioCategory.ROUTINE,
                "description": "Planned Return-to-Home",
                "telemetry": {
                    "altitude_m": (60, 100),
                    "speed_mps": (12, 20),        # Direct return speed
                    "battery_pct": (20, 40),
                    "mode": "RTH"
                },
                "threat_level": ThreatLevel.LOW,
                "decision": "RTH initiated per mission profile. Prepare for recovery.",
                "reasoning": "Planned return with adequate battery reserve. No anomalies."
            },
            "SURVEILLANCE_ORBIT": {
                "category": ScenarioCategory.ROUTINE,
                "description": "Circular surveillance pattern",
                "telemetry": {
                    "altitude_m": (100, 200),
                    "speed_mps": (8, 15),
                    "battery_pct": (45, 85),
                    "mode": "AUTO"
                },
                "threat_level": ThreatLevel.LOW,
                "decision": "Surveillance pattern stable. Continuing data collection.",
                "reasoning": "Orbit parameters within specification. Sensor payload active."
            },
            
            # --- STRESS SCENARIOS ---
            "HIGH_WINDS": {
                "category": ScenarioCategory.STRESS,
                "description": "Operating in high wind conditions",
                "telemetry": {
                    "altitude_m": (60, 130),      # Altitude instability
                    "speed_mps": (5, 25),         # Variable due to wind
                    "battery_pct": (25, 70),      # Higher drain
                    "mode": "AUTO"
                },
                "battery_drain_multiplier": 1.5,
                "threat_level": ThreatLevel.MEDIUM,
                "decision": "High wind warning. Consider RTH if conditions worsen. Monitor battery closely.",
                "reasoning": "Erratic speed and increased power consumption indicate adverse wind conditions."
            },
            "WEAK_SIGNAL": {
                "category": ScenarioCategory.STRESS,
                "description": "Degraded data link signal",
                "telemetry": {
                    "altitude_m": (80, 180),
                    "speed_mps": (8, 16),
                    "battery_pct": (30, 75),
                    "mode": "AUTO",
                    "signal_strength_pct": (15, 40)
                },
                "threat_level": ThreatLevel.MEDIUM,
                "decision": "Signal degradation detected. Increase altitude or return closer to GCS.",
                "reasoning": "Telemetry indicates potential link loss risk. Mission continuity threatened."
            },
            "EXTREME_RANGE": {
                "category": ScenarioCategory.STRESS,
                "description": "Operating at maximum communication range",
                "telemetry": {
                    "altitude_m": (150, 250),     # High altitude for range
                    "speed_mps": (12, 18),
                    "battery_pct": (25, 55),
                    "mode": "AUTO",
                    "latency_ms": (500, 2000)
                },
                "threat_level": ThreatLevel.MEDIUM,
                "decision": "At range limit. Prepare contingency for autonomous operation.",
                "reasoning": "High latency indicates extreme range. Link loss possible."
            },
            "LOW_BATTERY_WARNING": {
                "category": ScenarioCategory.STRESS,
                "description": "Battery below nominal but not critical",
                "telemetry": {
                    "altitude_m": (60, 120),
                    "speed_mps": (10, 16),
                    "battery_pct": (18, 25),
                    "mode": "AUTO"
                },
                "threat_level": ThreatLevel.MEDIUM,
                "decision": "Low battery warning. Initiate RTH within 5 minutes.",
                "reasoning": "Battery approaching critical threshold. Sufficient for controlled return."
            },
            
            # --- CRISIS SCENARIOS ---
            "BATTERY_CRITICAL": {
                "category": ScenarioCategory.CRISIS,
                "description": "Critical battery - emergency landing imminent",
                "telemetry": {
                    "altitude_m": (30, 80),
                    "speed_mps": (5, 15),         # Reduced to conserve power
                    "battery_pct": (5, 15),
                    "mode": "FORCED_LAND"
                },
                "threat_level": ThreatLevel.CRITICAL,
                "decision": "EMERGENCY! Initiate forced landing. Deploy recovery team.",
                "reasoning": "Critical battery level. Crash imminent without immediate landing."
            },
            "PROPELLER_ICING": {
                "category": ScenarioCategory.CRISIS,
                "description": "Ice accumulation on propellers",
                "telemetry": {
                    "altitude_m": (40, 100),      # Losing altitude
                    "speed_mps": (3, 10),         # Struggling to maintain
                    "battery_pct": (30, 60),      # Rapid drain from ice
                    "mode": "EMERGENCY"
                },
                "altitude_drop_rate": 5.0,        # meters per tick
                "threat_level": ThreatLevel.CRITICAL,
                "decision": "ICING EMERGENCY! Descend to warmer altitude. Prepare for emergency recovery.",
                "reasoning": "Altitude loss with high power consumption indicates propeller icing. Crash risk HIGH."
            },
            "GPS_SPOOFING": {
                "category": ScenarioCategory.CRISIS,
                "description": "GPS spoofing attack detected",
                "telemetry": {
                    "altitude_m": (50, 200),
                    "speed_mps": (0, 30),         # Erratic
                    "battery_pct": (30, 80),
                    "mode": "MANUAL",
                    "gps_jump_detected": True
                },
                "threat_level": ThreatLevel.CRITICAL,
                "decision": "GPS SPOOFING DETECTED! Switch to INS navigation. Initiate electronic countermeasures.",
                "reasoning": "Position jumps inconsistent with flight dynamics. Suspected hostile GPS manipulation."
            },
            "JAMMING": {
                "category": ScenarioCategory.CRISIS,
                "description": "Communication jamming - link lost",
                "telemetry": {
                    "altitude_m": (80, 150),
                    "speed_mps": (10, 16),
                    "battery_pct": (35, 75),
                    "mode": "LOST_LINK",
                    "signal_strength_pct": (0, 5)
                },
                "threat_level": ThreatLevel.CRITICAL,
                "decision": "TOTAL LINK LOSS! Asset operating autonomously. Deploy recovery teams to last known position.",
                "reasoning": "Complete signal loss in operational area. Suspected electronic warfare attack."
            },
            "MOTOR_FAILURE": {
                "category": ScenarioCategory.CRISIS,
                "description": "In-flight motor failure",
                "telemetry": {
                    "altitude_m": (20, 80),       # Descending rapidly
                    "speed_mps": (2, 20),         # Erratic
                    "battery_pct": (40, 80),
                    "mode": "EMERGENCY"
                },
                "threat_level": ThreatLevel.CRITICAL,
                "decision": "MOTOR FAILURE! Initiate emergency descent. Clear impact zone.",
                "reasoning": "Asymmetric thrust detected. Unable to maintain controlled flight."
            }
        },
        
        # =====================================================================
        # VEHICLE SCENARIOS (Tank/APC/Truck)
        # =====================================================================
        EntityType.VEHICLE: {
            # --- ROUTINE SCENARIOS ---
            "CONVOY_MODE": {
                "category": ScenarioCategory.ROUTINE,
                "description": "Standard convoy movement",
                "telemetry": {
                    "speed_kph": (40, 60),
                    "fuel_pct": (50, 95),
                    "engine_temp_c": (80, 95),
                    "health_pct": (85, 100),
                    "engine_state": "RUN"
                },
                "threat_level": ThreatLevel.LOW,
                "decision": "Convoy proceeding on route. Maintain spacing and speed.",
                "reasoning": "Vehicle telemetry nominal. Fuel and engine status optimal for mission."
            },
            "IDLING_ENGINE": {
                "category": ScenarioCategory.ROUTINE,
                "description": "Vehicle idling at checkpoint",
                "telemetry": {
                    "speed_kph": (0, 0),
                    "fuel_pct": (40, 90),
                    "engine_temp_c": (70, 85),
                    "health_pct": (90, 100),
                    "engine_state": "IDLE"
                },
                "fuel_burn_rate": 0.1,            # per minute
                "threat_level": ThreatLevel.LOW,
                "decision": "Vehicle at checkpoint. Status nominal.",
                "reasoning": "Engine idling within parameters. Position secure."
            },
            "BASE_MAINTENANCE": {
                "category": ScenarioCategory.ROUTINE,
                "description": "Vehicle in maintenance bay",
                "telemetry": {
                    "speed_kph": (0, 0),
                    "fuel_pct": (10, 50),         # May be drained for maintenance
                    "engine_temp_c": (20, 40),    # Cold engine
                    "health_pct": (60, 95),
                    "engine_state": "OFF"
                },
                "threat_level": ThreatLevel.LOW,
                "decision": "Vehicle in maintenance. Non-operational status acknowledged.",
                "reasoning": "Scheduled maintenance activity. Vehicle not mission-ready."
            },
            "PATROL_ROUTE": {
                "category": ScenarioCategory.ROUTINE,
                "description": "Standard patrol route",
                "telemetry": {
                    "speed_kph": (20, 45),
                    "fuel_pct": (55, 90),
                    "engine_temp_c": (85, 100),
                    "health_pct": (90, 100),
                    "engine_state": "RUN"
                },
                "threat_level": ThreatLevel.LOW,
                "decision": "Patrol proceeding normally. No anomalies.",
                "reasoning": "Vehicle operating within normal parameters on assigned route."
            },
            
            # --- STRESS SCENARIOS ---
            "ROUGH_TERRAIN": {
                "category": ScenarioCategory.STRESS,
                "description": "Traversing difficult terrain",
                "telemetry": {
                    "speed_kph": (10, 30),        # Slowed by terrain
                    "fuel_pct": (35, 80),         # Higher consumption
                    "engine_temp_c": (95, 115),   # Running hot
                    "health_pct": (75, 95),
                    "engine_state": "RUN"
                },
                "threat_level": ThreatLevel.MEDIUM,
                "decision": "Terrain stress detected. Monitor suspension and drivetrain.",
                "reasoning": "Variable speed and elevated engine temp indicate challenging terrain. Watch for damage."
            },
            "LOW_FUEL": {
                "category": ScenarioCategory.STRESS,
                "description": "Fuel running low",
                "telemetry": {
                    "speed_kph": (30, 50),
                    "fuel_pct": (10, 20),         # Low fuel
                    "engine_temp_c": (85, 100),
                    "health_pct": (85, 100),
                    "engine_state": "RUN"
                },
                "threat_level": ThreatLevel.MEDIUM,
                "decision": "Low fuel warning. Proceed to nearest resupply point.",
                "reasoning": "Fuel level insufficient for extended operations. Risk of stranding."
            },
            "ENGINE_OVERHEAT": {
                "category": ScenarioCategory.STRESS,
                "description": "Engine running hot",
                "telemetry": {
                    "speed_kph": (20, 40),
                    "fuel_pct": (40, 80),
                    "engine_temp_c": (115, 130),  # Overheating
                    "health_pct": (70, 90),
                    "engine_state": "RUN"
                },
                "threat_level": ThreatLevel.MEDIUM,
                "decision": "Engine overheat warning. Reduce speed or halt for cooldown.",
                "reasoning": "Engine temperature exceeding safe limits. Risk of engine damage."
            },
            "SUSPENSION_STRESS": {
                "category": ScenarioCategory.STRESS,
                "description": "Suspension system under stress",
                "telemetry": {
                    "speed_kph": (15, 35),
                    "fuel_pct": (45, 85),
                    "engine_temp_c": (90, 105),
                    "health_pct": (65, 80),
                    "engine_state": "RUN"
                },
                "threat_level": ThreatLevel.MEDIUM,
                "decision": "Suspension wear detected. Schedule maintenance after mission.",
                "reasoning": "Health percentage declining during rough terrain operation."
            },
            
            # --- CRISIS SCENARIOS ---
            "IED_STRIKE": {
                "category": ScenarioCategory.CRISIS,
                "description": "Vehicle struck by IED",
                "telemetry": {
                    "speed_kph": (0, 0),          # Immediate stop
                    "fuel_pct": (0, 60),          # May be leaking
                    "engine_temp_c": (100, 200),  # Possible fire
                    "health_pct": (0, 30),        # Critical damage
                    "engine_state": "DAMAGED"
                },
                "threat_level": ThreatLevel.CRITICAL,
                "decision": "IED STRIKE! Deploy QRF and MEDEVAC. Secure perimeter. Check for secondary devices.",
                "reasoning": "Catastrophic damage signature detected. Crew casualties likely. Hostile area."
            },
            "AMBUSH": {
                "category": ScenarioCategory.CRISIS,
                "description": "Vehicle convoy under ambush",
                "telemetry": {
                    "speed_kph": (0, 80),         # Erratic - evasive action
                    "fuel_pct": (30, 80),
                    "engine_temp_c": (95, 120),
                    "health_pct": (40, 85),       # Taking damage
                    "engine_state": "RUN"
                },
                "threat_level": ThreatLevel.CRITICAL,
                "decision": "AMBUSH! Execute break contact drill. Request fire support and QRF.",
                "reasoning": "Erratic acceleration and declining health indicate hostile contact. Immediate action required."
            },
            "FUEL_LEAK": {
                "category": ScenarioCategory.CRISIS,
                "description": "Critical fuel leak",
                "telemetry": {
                    "speed_kph": (0, 30),
                    "fuel_pct": (5, 40),          # Dropping rapidly
                    "engine_temp_c": (85, 110),
                    "health_pct": (50, 80),
                    "engine_state": "RUN"
                },
                "fuel_drop_rate": 5.0,            # percent per minute
                "threat_level": ThreatLevel.HIGH,
                "decision": "FUEL LEAK CRITICAL! Halt vehicle. Fire hazard. Prepare for recovery.",
                "reasoning": "Rapid fuel depletion indicates major leak. Fire and stranding risk."
            },
            "ROLLOVER": {
                "category": ScenarioCategory.CRISIS,
                "description": "Vehicle rollover accident",
                "telemetry": {
                    "speed_kph": (0, 0),
                    "fuel_pct": (20, 70),
                    "engine_temp_c": (60, 100),
                    "health_pct": (10, 40),
                    "engine_state": "OFF",
                    "orientation": "INVERTED"
                },
                "threat_level": ThreatLevel.CRITICAL,
                "decision": "ROLLOVER! Deploy recovery team. Check crew for injuries. Watch for fire.",
                "reasoning": "Vehicle orientation inverted. Crew likely injured. Asset non-recoverable in field."
            },
            "ENGINE_FIRE": {
                "category": ScenarioCategory.CRISIS,
                "description": "Engine compartment fire",
                "telemetry": {
                    "speed_kph": (0, 5),          # Stopping
                    "fuel_pct": (20, 60),
                    "engine_temp_c": (200, 400),  # Extreme heat
                    "health_pct": (15, 45),
                    "engine_state": "FIRE"
                },
                "threat_level": ThreatLevel.CRITICAL,
                "decision": "ENGINE FIRE! Evacuate crew immediately. Deploy fire suppression. Maintain safe distance.",
                "reasoning": "Extreme engine temperature indicates active fire. Ammunition cook-off risk."
            }
        }
    }
    
    @classmethod
    def get_scenarios_for_entity(cls, entity_type: EntityType) -> Dict[str, Dict]:
        """Get all scenarios for a specific entity type."""
        return cls.SCENARIOS.get(entity_type, {})
    
    @classmethod
    def get_scenario(cls, entity_type: EntityType, scenario_name: str) -> Optional[Dict]:
        """Get a specific scenario by entity type and name."""
        entity_scenarios = cls.SCENARIOS.get(entity_type, {})
        return entity_scenarios.get(scenario_name)
    
    @classmethod
    def get_scenarios_by_category(cls, entity_type: EntityType, category: ScenarioCategory) -> List[str]:
        """Get all scenario names for a given entity type and category."""
        entity_scenarios = cls.SCENARIOS.get(entity_type, {})
        return [
            name for name, config in entity_scenarios.items()
            if config.get("category") == category
        ]
    
    @classmethod
    def get_random_scenario(cls, entity_type: EntityType, category: Optional[ScenarioCategory] = None) -> Tuple[str, Dict]:
        """Get a random scenario, optionally filtered by category."""
        entity_scenarios = cls.SCENARIOS.get(entity_type, {})
        
        if category:
            filtered = {k: v for k, v in entity_scenarios.items() if v.get("category") == category}
        else:
            filtered = entity_scenarios
            
        if not filtered:
            raise ValueError(f"No scenarios found for {entity_type} with category {category}")
            
        name = random.choice(list(filtered.keys()))
        return name, filtered[name]


# ============================================================================
#                           GROUND TRUTH GENERATOR
# ============================================================================

class GroundTruthGenerator:
    """
    Generates ground truth labels based on scenario type.
    Maps scenario categories to threat levels and generates appropriate decisions.
    """
    
    @staticmethod
    def get_label(entity_type: EntityType, scenario_name: str, telemetry: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate ground truth label for a telemetry sample.
        
        Returns:
            Dict with threat_level, decision, reasoning, and confidence
        """
        scenario = ScenarioLibrary.get_scenario(entity_type, scenario_name)
        
        if not scenario:
            return {
                "threat_level": ThreatLevel.UNKNOWN.value,
                "decision": "Unable to analyze - scenario not found.",
                "reasoning": f"Unknown scenario: {scenario_name}",
                "confidence": 0.0
            }
        
        category = scenario.get("category", ScenarioCategory.ROUTINE)
        threat_level = scenario.get("threat_level", ThreatLevel.LOW)
        
        # Add dynamic elements to decision and reasoning
        decision = GroundTruthGenerator._enhance_decision(
            scenario.get("decision", "Continue monitoring."),
            entity_type, telemetry
        )
        
        reasoning = GroundTruthGenerator._enhance_reasoning(
            scenario.get("reasoning", "Analysis based on telemetry data."),
            entity_type, telemetry, scenario_name
        )
        
        # Confidence based on category
        confidence_map = {
            ScenarioCategory.ROUTINE: random.uniform(0.85, 0.98),
            ScenarioCategory.STRESS: random.uniform(0.75, 0.92),
            ScenarioCategory.CRISIS: random.uniform(0.88, 0.99)  # High confidence in crisis
        }
        confidence = confidence_map.get(category, 0.80)
        
        return {
            "threat_level": threat_level.value,
            "decision": decision,
            "reasoning": reasoning,
            "confidence": round(confidence, 3),
            "scenario_category": category.value,
            "scenario_name": scenario_name
        }
    
    @staticmethod
    def _enhance_decision(base_decision: str, entity_type: EntityType, telemetry: Dict) -> str:
        """Add dynamic context to decision."""
        source_id = telemetry.get("source_id", "UNKNOWN")
        return f"{base_decision} [Asset: {source_id}]"
    
    @staticmethod
    def _enhance_reasoning(base_reasoning: str, entity_type: EntityType, 
                          telemetry: Dict, scenario_name: str) -> str:
        """Add specific telemetry values to reasoning."""
        details = []
        
        if entity_type == EntityType.SOLDIER:
            vitals = telemetry.get("vitals", {})
            if vitals:
                details.append(f"HR: {vitals.get('hr_bpm', 'N/A')} BPM")
                details.append(f"SpO2: {vitals.get('spo2', 'N/A')}%")
        
        elif entity_type == EntityType.DRONE:
            details.append(f"Alt: {telemetry.get('altitude', 'N/A')}m")
            details.append(f"Battery: {telemetry.get('battery_level', 'N/A')}%")
        
        elif entity_type == EntityType.VEHICLE:
            details.append(f"Speed: {telemetry.get('speed', 'N/A')} km/h")
            details.append(f"Fuel: {telemetry.get('fuel_pct', 'N/A')}%")
        
        if details:
            return f"{base_reasoning} Telemetry: [{', '.join(details)}]"
        return base_reasoning


# ============================================================================
#                           NOISE INJECTOR
# ============================================================================

class NoiseInjector:
    """
    Injects realistic sensor noise and data dropouts into telemetry.
    Simulates real-world sensor imperfection and communication issues.
    """
    
    DEFAULT_NOISE_CONFIG = {
        "coordinate_noise_m": 2.0,      # GPS noise in meters
        "altitude_noise_m": 1.5,
        "speed_noise_pct": 0.05,        # 5% speed variation
        "temperature_noise_c": 0.3,
        "percentage_noise": 1.0,        # For battery, fuel, etc.
        "heart_rate_noise": 3,          # BPM variation
        "dropout_probability": 0.02,    # 2% chance of null value
        "spike_probability": 0.005      # 0.5% chance of anomalous spike
    }
    
    def __init__(self, config: Optional[Dict] = None):
        self.config = {**self.DEFAULT_NOISE_CONFIG, **(config or {})}
    
    def inject_noise(self, telemetry: Dict[str, Any], entity_type: EntityType) -> Dict[str, Any]:
        """
        Apply realistic noise to telemetry data.
        Creates a deep copy to avoid modifying original.
        """
        import copy
        noisy = copy.deepcopy(telemetry)
        
        # Apply coordinate noise
        if "latitude" in noisy:
            noisy["latitude"] = self._add_coordinate_noise(noisy["latitude"])
        if "longitude" in noisy:
            noisy["longitude"] = self._add_coordinate_noise(noisy["longitude"])
        
        # Apply altitude noise
        if "altitude" in noisy:
            noisy["altitude"] = self._add_gaussian_noise(
                noisy["altitude"], 
                self.config["altitude_noise_m"]
            )
        
        # Entity-specific noise
        if entity_type == EntityType.SOLDIER:
            noisy = self._inject_soldier_noise(noisy)
        elif entity_type == EntityType.DRONE:
            noisy = self._inject_drone_noise(noisy)
        elif entity_type == EntityType.VEHICLE:
            noisy = self._inject_vehicle_noise(noisy)
        
        # Random dropouts
        noisy = self._apply_dropouts(noisy)
        
        return noisy
    
    def _add_coordinate_noise(self, value: float) -> float:
        """Add GPS-like noise to coordinates."""
        # Convert meters to degrees (approximate)
        noise_deg = random.gauss(0, self.config["coordinate_noise_m"] / 111320)
        return round(value + noise_deg, 7)
    
    def _add_gaussian_noise(self, value: float, std_dev: float) -> float:
        """Add Gaussian noise to a value."""
        if value is None:
            return None
        noisy = value + random.gauss(0, std_dev)
        return round(noisy, 2)
    
    def _add_percentage_noise(self, value: float) -> float:
        """Add noise to percentage values (0-100)."""
        if value is None:
            return None
        noisy = value + random.gauss(0, self.config["percentage_noise"])
        return round(max(0, min(100, noisy)), 1)
    
    def _inject_soldier_noise(self, telemetry: Dict) -> Dict:
        """Add noise to soldier vitals."""
        if "vitals" in telemetry:
            vitals = telemetry["vitals"]
            
            if "hr_bpm" in vitals and vitals["hr_bpm"] is not None:
                vitals["hr_bpm"] = max(0, int(vitals["hr_bpm"] + random.gauss(0, self.config["heart_rate_noise"])))
            
            if "spo2" in vitals and vitals["spo2"] is not None:
                vitals["spo2"] = round(max(0, min(100, vitals["spo2"] + random.gauss(0, 0.5))), 1)
            
            if "resp_bpm" in vitals and vitals["resp_bpm"] is not None:
                vitals["resp_bpm"] = max(0, round(vitals["resp_bpm"] + random.gauss(0, 1.5), 1))
            
            if "skin_temp_c" in vitals and vitals["skin_temp_c"] is not None:
                vitals["skin_temp_c"] = round(vitals["skin_temp_c"] + random.gauss(0, self.config["temperature_noise_c"]), 1)
        
        if "speed" in telemetry and telemetry["speed"] is not None:
            telemetry["speed"] = round(max(0, telemetry["speed"] * (1 + random.gauss(0, self.config["speed_noise_pct"]))), 2)
        
        return telemetry
    
    def _inject_drone_noise(self, telemetry: Dict) -> Dict:
        """Add noise to drone telemetry."""
        if "speed" in telemetry and telemetry["speed"] is not None:
            telemetry["speed"] = round(max(0, telemetry["speed"] * (1 + random.gauss(0, self.config["speed_noise_pct"]))), 2)
        
        if "battery_level" in telemetry:
            telemetry["battery_level"] = self._add_percentage_noise(telemetry["battery_level"])
        
        return telemetry
    
    def _inject_vehicle_noise(self, telemetry: Dict) -> Dict:
        """Add noise to vehicle telemetry."""
        if "speed" in telemetry and telemetry["speed"] is not None:
            telemetry["speed"] = round(max(0, telemetry["speed"] * (1 + random.gauss(0, self.config["speed_noise_pct"]))), 2)
        
        if "fuel_pct" in telemetry:
            telemetry["fuel_pct"] = self._add_percentage_noise(telemetry["fuel_pct"])
        
        if "health_pct" in telemetry:
            telemetry["health_pct"] = self._add_percentage_noise(telemetry["health_pct"])
        
        if "engine_temp_c" in telemetry and telemetry["engine_temp_c"] is not None:
            telemetry["engine_temp_c"] = round(telemetry["engine_temp_c"] + random.gauss(0, 2.0), 1)
        
        return telemetry
    
    def _apply_dropouts(self, telemetry: Dict) -> Dict:
        """
        Randomly set some non-critical values to None to simulate sensor failures.
        Critical fields like source_id and type are never dropped.
        """
        protected_fields = {"source_id", "type", "timestamp", "latitude", "longitude"}
        
        def apply_to_dict(d: Dict, path: str = "") -> Dict:
            for key, value in list(d.items()):
                full_key = f"{path}.{key}" if path else key
                
                if key in protected_fields:
                    continue
                
                if isinstance(value, dict):
                    apply_to_dict(value, full_key)
                elif random.random() < self.config["dropout_probability"]:
                    d[key] = None
            
            return d
        
        return apply_to_dict(telemetry)
    
    def inject_anomalous_spike(self, telemetry: Dict, entity_type: EntityType) -> Dict:
        """
        Inject a random anomalous spike to test AI detection.
        Used sparingly to create edge cases.
        """
        if random.random() > self.config["spike_probability"]:
            return telemetry
        
        import copy
        spiked = copy.deepcopy(telemetry)
        
        if entity_type == EntityType.SOLDIER and "vitals" in spiked:
            # Random vital spike
            spike_type = random.choice(["hr", "temp"])
            if spike_type == "hr":
                spiked["vitals"]["hr_bpm"] = random.randint(180, 220)
            else:
                spiked["vitals"]["skin_temp_c"] = random.uniform(39.5, 42.0)
        
        elif entity_type == EntityType.DRONE:
            # Random altitude spike
            if "altitude" in spiked:
                spiked["altitude"] = spiked.get("altitude", 100) + random.randint(50, 200)
        
        return spiked


# ============================================================================
#                           UTILITY FUNCTIONS
# ============================================================================

def random_value_in_range(range_tuple: Tuple[float, float]) -> float:
    """Generate a random value within a given range."""
    return random.uniform(range_tuple[0], range_tuple[1])

def generate_source_id(entity_type: EntityType, index: int = None) -> str:
    """Generate a realistic source ID for an entity."""
    prefixes = {
        EntityType.SOLDIER: ["ALPHA", "BRAVO", "CHARLIE", "DELTA", "ECHO"],
        EntityType.DRONE: ["UAV", "REAPER", "SCAN", "HAWK", "EAGLE"],
        EntityType.VEHICLE: ["TANK", "APC", "MRAP", "HUMVEE", "LAV"]
    }
    
    prefix = random.choice(prefixes.get(entity_type, ["UNIT"]))
    suffix = index if index is not None else random.randint(1, 99)
    
    return f"{prefix}-{suffix:02d}"

def generate_timestamp() -> str:
    """Generate an ISO format timestamp."""
    import datetime
    return datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc).isoformat()


# ============================================================================
#                           EXPORTS
# ============================================================================

__all__ = [
    "EntityType",
    "ScenarioCategory", 
    "ThreatLevel",
    "ScenarioLibrary",
    "GroundTruthGenerator",
    "NoiseInjector",
    "random_value_in_range",
    "generate_source_id",
    "generate_timestamp"
]
