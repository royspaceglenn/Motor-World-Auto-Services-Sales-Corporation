# Stops processes that lock electron-builder output (release\win-unpacked).
$ErrorActionPreference = 'SilentlyContinue'

$efcpRoot = Split-Path -Parent $PSScriptRoot
$winUnpacked = [System.IO.Path]::GetFullPath((Join-Path $efcpRoot 'release\win-unpacked'))

Stop-Process -Name 'EFCP Motor Parts and Trading' -Force -ErrorAction SilentlyContinue
Stop-Process -Name 'EFCP Desktop' -Force -ErrorAction SilentlyContinue

Get-CimInstance Win32_Process |
  Where-Object { $_.ExecutablePath -and ($_.ExecutablePath.StartsWith($winUnpacked, [StringComparison]::OrdinalIgnoreCase)) } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

Start-Sleep -Seconds 3
