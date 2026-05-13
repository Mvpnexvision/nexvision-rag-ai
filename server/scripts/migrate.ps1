$ErrorActionPreference = 'Stop'

Set-Location $PSScriptRoot

$projectRoot = Split-Path -Parent $PSScriptRoot
$migrationsDir = Join-Path $projectRoot 'migrations'
$legacyMigration = Join-Path $projectRoot 'supabase_setup.sql'

$dbUrl = $env:SUPABASE_DB_URL
if (-not $dbUrl) { $dbUrl = $env:DATABASE_URL }

if (-not $dbUrl) {
    Write-Host 'Missing database connection string.' -ForegroundColor Yellow
    Write-Host 'Set SUPABASE_DB_URL or DATABASE_URL to your Supabase Postgres connection string.' -ForegroundColor Yellow
    Write-Host 'Supabase API keys alone are not enough to execute SQL migrations.' -ForegroundColor Yellow
    exit 1
}

$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) {
    Write-Host 'psql was not found.' -ForegroundColor Yellow
    Write-Host 'Install PostgreSQL client tools, then try again.' -ForegroundColor Yellow
    exit 1
}

$migrationFiles = @()
if (Test-Path $migrationsDir) {
    $migrationFiles = Get-ChildItem -Path $migrationsDir -Filter '*.sql' | Sort-Object Name
}

if (-not $migrationFiles -or $migrationFiles.Count -eq 0) {
    if (-not (Test-Path $legacyMigration)) {
        throw "No migration SQL files found in $migrationsDir and fallback file is missing: $legacyMigration"
    }

    $migrationFiles = @((Get-Item $legacyMigration))
}

Write-Host "Applying $($migrationFiles.Count) migration file(s)..." -ForegroundColor Cyan

foreach ($file in $migrationFiles) {
    Write-Host "Running $($file.Name)" -ForegroundColor Green
    & $psql.Source $dbUrl -v ON_ERROR_STOP=1 -f $file.FullName

    if ($LASTEXITCODE -ne 0) {
        throw "Migration failed: $($file.Name)"
    }
}

Write-Host 'Migrations completed successfully.' -ForegroundColor Green