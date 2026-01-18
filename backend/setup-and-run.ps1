# Setup and run script for Game Hub backend
# Usage (PowerShell as Administrator):
#   powershell -ExecutionPolicy Bypass -File .\setup-and-run.ps1

$backendDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Write-Host "Backend directory: $backendDir"

function Command-Exists($cmd) {
    $null -ne (Get-Command $cmd -ErrorAction SilentlyContinue)
}

# Check for Node.js
if (Command-Exists node) {
    Write-Host "Node is already installed: $(node -v)"
} else {
    Write-Host "Node.js not found. Attempting to install via winget or chocolatey..."

    if (Command-Exists winget) {
        Write-Host "Using winget to install Node.js LTS (requires Admin)."
        winget install --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements
    } elseif (Command-Exists choco) {
        Write-Host "Using chocolatey to install Node.js LTS (requires Admin)."
        choco install nodejs-lts -y
    } else {
        Write-Host "Neither winget nor chocolatey found. Opening Node.js download page in browser. Please install Node.js LTS manually and re-run this script."
        Start-Process "https://nodejs.org/en/download/"
        exit 1
    }

    if (-not (Command-Exists node)) {
        Write-Host "Installation attempted but 'node' is still not available in this session. Please close and reopen your terminal (or restart Windows) and re-run this script."
        exit 1
    }
}

Write-Host "Node and npm are available. Versions: node $(node -v), npm $(npm -v)"

# Install backend dependencies
Push-Location $backendDir
if (Test-Path package.json) {
    Write-Host "Installing npm dependencies..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "npm install failed with exit code $LASTEXITCODE"
        Pop-Location
        exit $LASTEXITCODE
    }
} else {
    Write-Host "No package.json found in $backendDir. Aborting."
    Pop-Location
    exit 1
}

# Start the server in a new window
Write-Host "Starting the server (npm start) in a new PowerShell window..."
$startArgs = "-NoExit -Command cd `"$backendDir`"; npm start"
Start-Process powershell -ArgumentList $startArgs

Pop-Location
Write-Host "Script finished. If the server started, open http://localhost:3000 in your browser."