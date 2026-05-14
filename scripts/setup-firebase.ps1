param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectId,

  [Parameter(Mandatory = $true)]
  [string]$ApiKey,

  [Parameter(Mandatory = $true)]
  [string]$AppId,

  [Parameter(Mandatory = $true)]
  [string]$MessagingSenderId,

  [string]$AuthDomain = "",
  [string]$StorageBucket = "",
  [string]$FunctionsRegion = "us-central1",
  [string]$ShopId = "main",

  [Parameter(Mandatory = $true)]
  [string]$ServiceAccountPath,

  [switch]$SkipDeploy
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if ([string]::IsNullOrWhiteSpace($AuthDomain)) {
  $AuthDomain = "$ProjectId.firebaseapp.com"
}

if ([string]::IsNullOrWhiteSpace($StorageBucket)) {
  $StorageBucket = "$ProjectId.firebasestorage.app"
}

$resolvedServiceAccountPath = Resolve-Path $ServiceAccountPath -ErrorAction Stop

$envContent = @"
VITE_FIREBASE_API_KEY=$ApiKey
VITE_FIREBASE_APP_ID=$AppId
VITE_FIREBASE_PROJECT_ID=$ProjectId
VITE_FIREBASE_MESSAGING_SENDER_ID=$MessagingSenderId
VITE_FIREBASE_AUTH_DOMAIN=$AuthDomain
VITE_FIREBASE_STORAGE_BUCKET=$StorageBucket
VITE_FIREBASE_FUNCTIONS_REGION=$FunctionsRegion
VITE_FIREBASE_SHOP_ID=$ShopId
VITE_FIREBASE_VIEWER_SHOP_ID=$ShopId
FIREBASE_SERVICE_ACCOUNT_JSON_PATH=$($resolvedServiceAccountPath.Path)
"@

Set-Content -Path ".env" -Value $envContent -Encoding UTF8

$firebasercContent = @"
{
  "projects": {
    "default": "$ProjectId"
  }
}
"@

Set-Content -Path ".firebaserc" -Value $firebasercContent -Encoding UTF8

Write-Host "Updated .env and .firebaserc for project $ProjectId"

Write-Host "Installing root dependencies if needed..."
npm install

Write-Host "Installing Functions dependencies..."
Push-Location "functions"
npm install
Pop-Location

Write-Host "Checking Firebase CLI authentication..."
firebase projects:list | Out-Null

Write-Host "Seeding Firebase Auth users..."
npm run firebase:seed-users

Write-Host "Migrating JSON data and uploads..."
npm run firebase:migrate-data

if (-not $SkipDeploy) {
  Write-Host "Deploying Firestore, Storage, Functions, and Hosting..."
  firebase deploy --only firestore:rules,firestore:indexes,storage,functions,hosting
} else {
  Write-Host "Skipping deploy because -SkipDeploy was provided."
}

Write-Host "Firebase setup complete."
