# ==============================================================================
# SINAPS C4ISR - TACTICAL AI DEMO
# Version: Final Safe (No Special Chars)
# ==============================================================================

$ErrorActionPreference = "SilentlyContinue"
$BaseUrl = "http://127.0.0.1:8000/analyze"

Clear-Host

function Show-Separator {
    Write-Host "================================================================================" -ForegroundColor DarkGray
}

function Show-Title {
    Write-Host ""
    Write-Host "################################################################################" -ForegroundColor Cyan
    Write-Host "          SINAPS C4ISR | AI-SUPPORTED TACTICAL DECISION SYSTEM" -ForegroundColor White -BackgroundColor DarkBlue
    Write-Host "################################################################################" -ForegroundColor Cyan
    Write-Host "System Status : ONLINE" -ForegroundColor Green
    Write-Host "Model Adapter : ACTIVE [Fine-Tuned]" -ForegroundColor Green
    Write-Host ""
}

function Send-Scenario {
    param (
        [string]$Entity,
        [string]$ScenarioName,
        [string]$Context,
        [hashtable]$Payload
    )

    Show-Separator
    Write-Host "[$Entity] SCENARIO: $ScenarioName" -ForegroundColor Yellow
    Write-Host "CONTEXT : $Context" -ForegroundColor Gray
    Write-Host "----------------------------------------------------------------" -ForegroundColor DarkGray
    
    # JSON Hazirligi
    $JsonPayload = $Payload | ConvertTo-Json -Depth 5
    
    # Simulasyon Efektleri
    Write-Host "Telemetry..." -NoNewline
    Start-Sleep -Milliseconds 200
    Write-Host " [OK]" -ForegroundColor Green
    
    Write-Host "Analyzing..." -NoNewline
    Start-Sleep -Milliseconds 500
    Write-Host " [DONE]" -ForegroundColor Green
    Write-Host ""

    # API Istegi
    try {
        $Response = Invoke-RestMethod -Uri $BaseUrl -Method Post -Body $JsonPayload -ContentType "application/json"
        
        # --- RAPOR EKRANI ---
        
        $BgColor = "Black"
        $TitleColor = "Magenta"
        
        if ($Response.threat_level -eq "CRITICAL") { 
            $BgColor = "DarkRed" 
            $TitleColor = "White"
        }

        Write-Host "=== TACTICAL ANALYSIS REPORT ===" -ForegroundColor $TitleColor -BackgroundColor $BgColor
        
        $TColor = "Green"
        if ($Response.threat_level -eq "MEDIUM") { $TColor = "Yellow" }
        if ($Response.threat_level -eq "HIGH") { $TColor = "Red" }
        if ($Response.threat_level -eq "CRITICAL") { $TColor = "White" }

        Write-Host "THREAT LEVEL : " -NoNewline -BackgroundColor $BgColor
        Write-Host $Response.threat_level -ForegroundColor $TColor -BackgroundColor $BgColor
        
        Write-Host "DECISION     : " -NoNewline -BackgroundColor $BgColor
        Write-Host $Response.decision -ForegroundColor White -BackgroundColor $BgColor
        
        Write-Host "REASONING    : " -NoNewline -BackgroundColor $BgColor
        Write-Host $Response.reasoning -ForegroundColor Cyan -BackgroundColor $BgColor
        
        Write-Host "CONFIDENCE   : " -NoNewline -BackgroundColor $BgColor
        Write-Host ($Response.confidence * 100).ToString("0.0") "%" -ForegroundColor Gray -BackgroundColor $BgColor
        
        if ($Response.threat_level -eq "CRITICAL") {
             Write-Host "================================" -ForegroundColor White -BackgroundColor $BgColor
        }

    } catch {
        Write-Host "ERROR: Data Validation Failed or Service Unavailable." -ForegroundColor Red
        Write-Host "Server Response: $($_.Exception.Message)" -ForegroundColor DarkRed
    }
    
    Write-Host ""
    Write-Host "Press [ENTER] for next scenario..." -ForegroundColor DarkGray
    Read-Host
}

# ==============================================================================
# INITIALIZATION
# ==============================================================================

Show-Title
# '&' isareti 'and' ile degistirildi
Write-Host "Initializing multi-domain telemetry simulation [Land and Air]..."
Write-Host "Sending strictly validated JSON payloads..."
Write-Host ""
Read-Host "Press [ENTER] to Start Demonstration"

# ==============================================================================
# PART 1: INFANTRY (SOLDIER)
# Schema: source_id, lat, lon, vitals(hr_bpm, spo2)
# ==============================================================================
Write-Host "`n>>> UNIT TYPE: INFANTRY [SOLDIER]" -ForegroundColor Green

# 1.1 ROUTINE
$S1 = @{ 
    "telemetry" = @{ 
        "type"="soldier"; 
        "source_id"="ALPHA-01"; 
        "latitude"=39.92; 
        "longitude"=32.85; 
        "vitals"=@{
            "hr_bpm"=72; 
            "spo2"=98.5
        }; 
        "status"="ACTIVE"
    } 
}
Send-Scenario -Entity "SOLDIER" -ScenarioName "ROUTINE PATROL" -Context "Vitals normal. HR: 72 bpm, SpO2: 98.5%" -Payload $S1

# 1.2 FATIGUE
$S2 = @{ 
    "telemetry" = @{ 
        "type"="soldier"; 
        "source_id"="ALPHA-01"; 
        "latitude"=39.93; 
        "longitude"=32.86; 
        "vitals"=@{
            "hr_bpm"=145; 
            "spo2"=96.0
        }; 
        "status"="ACTIVE"
    } 
}
Send-Scenario -Entity "SOLDIER" -ScenarioName "PHYSICAL STRESS" -Context "Elevated Heart Rate [145 bpm] due to terrain/load." -Payload $S2

# 1.3 CRITICAL
$S3 = @{ 
    "telemetry" = @{ 
        "type"="soldier"; 
        "source_id"="ALPHA-01"; 
        "latitude"=39.94; 
        "longitude"=32.87; 
        "vitals"=@{
            "hr_bpm"=185; 
            "spo2"=82.0
        }; 
        "status"="INJURED"
    } 
}
Send-Scenario -Entity "SOLDIER" -ScenarioName "CRITICAL TRAUMA [MEDEVAC]" -Context "Severe Tachycardia [185 bpm], Hypoxia [82%]." -Payload $S3


# ==============================================================================
# PART 2: UAV (DRONE)
# Schema: source_id, lat, lon, battery_level, altitude, mode, speed
# ==============================================================================
Write-Host "`n>>> UNIT TYPE: UAV [DRONE]" -ForegroundColor Cyan

# 2.1 SURVEILLANCE
$D1 = @{ 
    "telemetry" = @{ 
        "type"="drone"; 
        "source_id"="HAWK-01"; 
        "latitude"=39.95; 
        "longitude"=32.85; 
        "battery_level"=88; 
        "altitude"=150; 
        "speed"=45;
        "mode"="AUTO"
    } 
}
Send-Scenario -Entity "DRONE" -ScenarioName "AREA SURVEILLANCE" -Context "Battery 88%, Altitude 150m. Mission nominal." -Payload $D1

# 2.2 RETURN TO HOME
$D2 = @{ 
    "telemetry" = @{ 
        "type"="drone"; 
        "source_id"="HAWK-01"; 
        "latitude"=39.96; 
        "longitude"=32.85; 
        "battery_level"=18; 
        "altitude"=140; 
        "speed"=25;
        "mode"="RTH"
    } 
}
Send-Scenario -Entity "DRONE" -ScenarioName "LOW BATTERY / RTH" -Context "Battery critical [18%]. Mode switched to RTH [Return to Home]." -Payload $D2

# 2.3 EMERGENCY LANDING
$D3 = @{ 
    "telemetry" = @{ 
        "type"="drone"; 
        "source_id"="HAWK-01"; 
        "latitude"=39.96; 
        "longitude"=32.85; 
        "battery_level"=5; 
        "altitude"=10; 
        "speed"=0;
        "mode"="LANDING"
    } 
}
Send-Scenario -Entity "DRONE" -ScenarioName "EMERGENCY LANDING" -Context "Battery Depleted [5%]. Forced Landing initiated." -Payload $D3


# ==============================================================================
# PART 3: ARMORED VEHICLE
# Schema: source_id, lat, lon, vehicle_type, fuel_pct, speed
# ==============================================================================
Write-Host "`n>>> UNIT TYPE: ARMORED VEHICLE" -ForegroundColor Yellow

# 3.1 LOGISTICS
$V1 = @{ 
    "telemetry" = @{ 
        "type"="vehicle"; 
        "source_id"="APC-09"; 
        "latitude"=39.90; 
        "longitude"=32.80; 
        "vehicle_type"="APC"; 
        "fuel_pct"=75; 
        "speed"=60
    } 
}
Send-Scenario -Entity "VEHICLE" -ScenarioName "CONVOY MOVEMENT" -Context "Fuel 75%, Speed 60 km/h. Routine transit." -Payload $V1

# 3.2 LOW FUEL WARNING
$V2 = @{ 
    "telemetry" = @{ 
        "type"="vehicle"; 
        "source_id"="APC-09"; 
        "latitude"=39.91; 
        "longitude"=32.81; 
        "vehicle_type"="APC"; 
        "fuel_pct"=10; 
        "speed"=45
    } 
}
Send-Scenario -Entity "VEHICLE" -ScenarioName "LOW FUEL WARNING" -Context "Fuel level critical [10%]. Logistics support required." -Payload $V2

# 3.3 IMMOBILIZED
$V3 = @{ 
    "telemetry" = @{ 
        "type"="vehicle"; 
        "source_id"="APC-09"; 
        "latitude"=39.91; 
        "longitude"=32.81; 
        "vehicle_type"="APC"; 
        "fuel_pct"=0; 
        "speed"=0
    } 
}
Send-Scenario -Entity "VEHICLE" -ScenarioName "VEHICLE IMMOBILIZED" -Context "Speed 0, Fuel 0 [Leak/Depleted]. Asset vulnerable." -Payload $V3

# ==============================================================================
# CONCLUSION
# ==============================================================================
Show-Separator
Write-Host "DEMONSTRATION COMPLETE." -ForegroundColor Green
Write-Host "Scroll up to review full incident logs." -ForegroundColor Gray
Write-Host ""
Read-Host "Press [ENTER] to Exit"