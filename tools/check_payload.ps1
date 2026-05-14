param([string]$Path)
$bytes = [System.IO.File]::ReadAllBytes($Path)
Write-Host "File: $Path"
Write-Host "Size: $($bytes.Length) bytes"
$head = $bytes | Select-Object -First 10 | ForEach-Object { '{0:X2}' -f $_ }
Write-Host "First 10 bytes (hex): $($head -join ' ')"
if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    Write-Host "WARNING: UTF-8 BOM detected!" -ForegroundColor Red
}
