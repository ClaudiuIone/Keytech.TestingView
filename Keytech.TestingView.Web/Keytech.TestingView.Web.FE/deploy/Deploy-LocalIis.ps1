# Deploy TestingView.Web.FE to local IIS on port 80 (origin behind Cloudflare HTTPS for testingview.com / www)
#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path $PSScriptRoot -Parent
$PublishRoot = "C:\inetpub\TestingView"
$SiteName = "TestingView"
$AppPoolName = "TestingView"
$PublicHosts = @("testingview.com", "www.testingview.com")
$ResourcesSource = Join-Path (Split-Path $ProjectRoot -Parent) "Resources"
if (-not (Test-Path $ResourcesSource)) {
    throw "Resources folder not found at $ResourcesSource"
}

Import-Module WebAdministration -ErrorAction Stop

function Stop-TestingViewAppPool {
    if (Test-Path "IIS:\AppPools\$AppPoolName") {
        $state = (Get-WebAppPoolState -Name $AppPoolName).Value
        if ($state -ne "Stopped") {
            Write-Host "Stopping app pool $AppPoolName ..." -ForegroundColor Cyan
            Stop-WebAppPool -Name $AppPoolName
            Start-Sleep -Seconds 3
        }
    }
}

function Start-TestingViewAppPool {
    if (Test-Path "IIS:\AppPools\$AppPoolName") {
        Write-Host "Starting app pool $AppPoolName ..." -ForegroundColor Cyan
        Start-WebAppPool -Name $AppPoolName
    }
}

Write-Host "Building Angular (production)..." -ForegroundColor Cyan
Push-Location (Join-Path $ProjectRoot "ClientApp")
try {
    npm install --silent 2>$null
    npm run build -- --configuration production
    if (-not (Test-Path "dist\client-app\browser\index.html")) { throw "Angular build did not produce dist\client-app\browser" }
}
finally {
    Pop-Location
}

Stop-TestingViewAppPool

Write-Host "Publishing ASP.NET app..." -ForegroundColor Cyan
Push-Location $ProjectRoot
try {
    dotnet publish -c Release -o $PublishRoot /p:SkipSpaBuild=true
    if ($LASTEXITCODE -ne 0) { throw "dotnet publish failed" }
}
finally {
    Pop-Location
}

$browserSource = Join-Path $ProjectRoot "ClientApp\dist\client-app\browser"
$browserDest = Join-Path $PublishRoot "ClientApp\dist\client-app\browser"
Write-Host "Copying Angular browser output to publish folder..." -ForegroundColor Cyan
if (Test-Path $browserDest) { Remove-Item $browserDest -Recurse -Force }
New-Item -ItemType Directory -Path (Split-Path $browserDest -Parent) -Force | Out-Null
Copy-Item -Path $browserSource -Destination $browserDest -Recurse
if (-not (Test-Path (Join-Path $browserDest "index.html"))) { throw "Angular index.html missing at $browserDest" }

$SolutionRoot = Split-Path (Split-Path $ProjectRoot -Parent) -Parent
$AppProject = Join-Path $SolutionRoot "Keytech.TestingView.App\Keytech.TestingView.App.csproj"
$AppPublishDir = Join-Path $env:TEMP "TestingView-App-publish-$(Get-Date -Format 'yyyyMMddHHmmss')"
$DesktopExeName = "TradingView x TestingView.exe"

if (-not (Test-Path $AppProject)) {
    throw "Desktop app project not found at $AppProject"
}

Write-Host "Publishing desktop app from Keytech.TestingView.App (win-x64)..." -ForegroundColor Cyan
dotnet publish $AppProject -c Release -r win-x64 -o $AppPublishDir /p:PublishSingleFile=true
if ($LASTEXITCODE -ne 0) { throw "dotnet publish Keytech.TestingView.App failed" }

$publishedExe = Join-Path $AppPublishDir $DesktopExeName
if (-not (Test-Path $publishedExe)) {
    throw "Expected desktop exe at $publishedExe"
}

$downloadsDir = Join-Path $PublishRoot "downloads"
New-Item -ItemType Directory -Path $downloadsDir -Force | Out-Null
Copy-Item -Path $publishedExe -Destination (Join-Path $downloadsDir $DesktopExeName) -Force
Write-Host "Copied desktop app to $downloadsDir\$DesktopExeName" -ForegroundColor Cyan
Remove-Item $AppPublishDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Copying Resources to $PublishRoot\Resources ..." -ForegroundColor Cyan
$destResources = Join-Path $PublishRoot "Resources"
if (Test-Path $destResources) { Remove-Item $destResources -Recurse -Force }
Copy-Item -Path $ResourcesSource -Destination $destResources -Recurse
$kbSource = Join-Path (Split-Path $ProjectRoot -Parent) "TestingView_Knowledge_Base_QA.md"
if (Test-Path $kbSource) {
    Copy-Item -Path $kbSource -Destination (Join-Path $destResources "TestingView_Knowledge_Base_QA.md") -Force
    Write-Host "Copied knowledge base Q&A markdown." -ForegroundColor Cyan
}

$csproj = Join-Path $ProjectRoot "Keytech.TestingView.Web.FE.csproj"
$stripeLocalPath = Join-Path (Split-Path $ProjectRoot -Parent) "stripe.local.json"
if (Test-Path $stripeLocalPath) {
    Write-Host "Importing Stripe keys from stripe.local.json into user secrets..." -ForegroundColor Cyan
    $stripeLocal = Get-Content $stripeLocalPath -Raw | ConvertFrom-Json
    if ($stripeLocal.Stripe) {
        foreach ($prop in $stripeLocal.Stripe.PSObject.Properties) {
            if ($prop.Value) {
                dotnet user-secrets set "Stripe:$($prop.Name)" "$($prop.Value)" --project $csproj | Out-Null
            }
        }
    }
}

Write-Host "Merging user secrets into production config..." -ForegroundColor Cyan
$secretsJson = dotnet user-secrets list --project $csproj 2>$null
$prodPath = Join-Path $PublishRoot "appsettings.Production.json"
$prodTemplate = Get-Content (Join-Path $ProjectRoot "appsettings.Production.json") -Raw | ConvertFrom-Json

$google = @{}
if ($prodTemplate.Google.ClientId) { $google.ClientId = [string]$prodTemplate.Google.ClientId }
$stripe = @{}
$email = @{}

foreach ($line in $secretsJson) {
    if ($line -match '^([^=]+)\s*=\s*(.+)$') {
        $key = $Matches[1].Trim()
        $val = $Matches[2].Trim()
        switch -Regex ($key) {
            '^Google:ClientId$' { $google.ClientId = $val }
            '^Google:ClientSecret$' { $google.ClientSecret = $val }
            '^Stripe:AccountId$' { $stripe.AccountId = $val }
            '^Stripe:SecretKey$' { $stripe.SecretKey = $val }
            '^Stripe:PublishableKey$' { $stripe.PublishableKey = $val }
            '^Stripe:WebhookSecret$' { $stripe.WebhookSecret = $val }
            '^Stripe:ExplorerPriceId$' { $stripe.ExplorerPriceId = $val }
            '^Stripe:TraderPriceId$' { $stripe.TraderPriceId = $val }
            '^Email:Password$' { $email.Password = $val }
            '^Email:Username$' { $email.Username = $val }
        }
    }
}

$prod = [ordered]@{
    Site = @{ BaseUrl = [string]$prodTemplate.Site.BaseUrl }
    Google = $google
    Stripe = $stripe
    Email = $email
    Logging = @{
        LogLevel = @{
            Default = "Information"
            "Microsoft.AspNetCore" = "Warning"
        }
    }
}

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($prodPath, ($prod | ConvertTo-Json -Depth 6), $utf8NoBom)

if (-not $google.ClientId -or -not $google.ClientSecret) {
    Write-Host "WARNING: Google OAuth is missing ClientId or ClientSecret in production config." -ForegroundColor Yellow
}
else {
    Write-Host "Google OAuth credentials written to production config." -ForegroundColor Green
}

if (-not $stripe.SecretKey) {
    Write-Host "WARNING: Stripe SecretKey missing in production config." -ForegroundColor Yellow
}
elseif ($stripe.SecretKey -like "sk_org_*" -and -not $stripe.AccountId) {
    Write-Host "WARNING: sk_org_ Stripe key requires Stripe:AccountId (acct_...). Copy stripe.local.json.example to stripe.local.json." -ForegroundColor Yellow
}
else {
    Write-Host "Stripe SecretKey written to production config." -ForegroundColor Green
}
if (-not $stripe.WebhookSecret) {
    Write-Host "WARNING: Stripe WebhookSecret missing - subscription sync after payment will not work until configured." -ForegroundColor Yellow
}
if (-not $stripe.PublishableKey) {
    Write-Host "NOTE: Stripe PublishableKey optional (Checkout uses server-side redirect)." -ForegroundColor DarkGray
}

if (-not (Test-Path "IIS:\AppPools\$AppPoolName")) {
    Write-Host "Creating app pool $AppPoolName ..." -ForegroundColor Cyan
    New-WebAppPool -Name $AppPoolName | Out-Null
    Set-ItemProperty "IIS:\AppPools\$AppPoolName" -Name managedRuntimeVersion -Value ""
    Set-ItemProperty "IIS:\AppPools\$AppPoolName" -Name processModel.identityType -Value "ApplicationPoolIdentity"
}

if (Test-Path "IIS:\Sites\$SiteName") {
    Write-Host "Removing existing site $SiteName ..." -ForegroundColor Yellow
    Remove-Website -Name $SiteName
}

Write-Host "Creating IIS site $SiteName on port 80 (Cloudflare terminates HTTPS) ..." -ForegroundColor Cyan
New-Website -Name $SiteName -PhysicalPath $PublishRoot -ApplicationPool $AppPoolName -Port 80 -HostHeader "testingview.com" -Force | Out-Null
New-WebBinding -Name $SiteName -Protocol http -Port 80 -HostHeader "www.testingview.com"
Write-Host "  Origin bindings: :80 testingview.com, www.testingview.com"
Write-Host "  Public URLs: https://testingview.com  https://www.testingview.com"

# Grant app pool read access to publish folder and data-protection key storage
icacls $PublishRoot /grant "IIS AppPool\${AppPoolName}:(OI)(CI)RX" /T | Out-Null
$dataProtectionDir = Join-Path $PublishRoot "DataProtection-Keys"
New-Item -ItemType Directory -Path $dataProtectionDir -Force | Out-Null
icacls $dataProtectionDir /grant "IIS AppPool\${AppPoolName}:(OI)(CI)M" | Out-Null

$sqlGrantScript = Join-Path $PSScriptRoot "Grant-IisSqlAccess.sql"
if (Test-Path $sqlGrantScript) {
    Write-Host "Ensuring SQL access for IIS AppPool\$AppPoolName ..." -ForegroundColor Cyan
    sqlcmd -S .\SQL1 -E -i $sqlGrantScript -b 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "WARNING: Could not apply Grant-IisSqlAccess.sql. Google sign-in may fail until IIS APPPOOL\$AppPoolName has DB access." -ForegroundColor Yellow
    }
}

$repairWebSchema = Join-Path $PSScriptRoot "Repair-WebSchema.sql"
if (Test-Path $repairWebSchema) {
    Write-Host "Applying Web schema repairs (ExternalLogins / Google sign-in) ..." -ForegroundColor Cyan
    sqlcmd -S .\SQL1 -E -d TestingView -i $repairWebSchema -b 2>&1 | Out-Null
}

Start-TestingViewAppPool

Write-Host ""
Write-Host "Deployment complete." -ForegroundColor Green
Write-Host "  Site:     $SiteName"
Write-Host "  Path:     $PublishRoot"
Write-Host "  URLs:     https://testingview.com  https://www.testingview.com"
Write-Host ""
Write-Host "Ensure ASP.NET Core 8 Hosting Bundle is installed." -ForegroundColor Yellow
Write-Host "If SQL auth fails, set the app pool to run as your Windows user (Integrated Security)." -ForegroundColor Yellow
Write-Host ""
Write-Host "Stripe Dashboard:" -ForegroundColor Yellow
Write-Host "  Webhook endpoint (live mode requires HTTPS): https://testingview.com/api/stripe/webhook"
Write-Host "  Events: checkout.session.completed, customer.subscription.*, invoice.payment_*"
if ($stripe.SecretKey -like "sk_org_*") {
    Write-Host "  For sk_org_ keys set Stripe:AccountId in stripe.local.json (Dashboard > account id acct_...)"
}
Write-Host ""
Write-Host "Google Cloud Console (OAuth client in Production):" -ForegroundColor Yellow
Write-Host "  Authorized redirect URIs:"
Write-Host "    https://testingview.com/signin-google"
Write-Host "    https://www.testingview.com/signin-google"
Write-Host "  Authorized JavaScript origins (optional):"
Write-Host "    https://testingview.com"
Write-Host "    https://www.testingview.com"
