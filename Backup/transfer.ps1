# Two-way sync between FTP root (/) and D:\proj\
# - Download when remote is newer (or local missing)
# - Upload when local is newer (or remote missing)
#
# Speed: KeepAlive reuses the FTP connection; timestamps come from LIST
# (one round-trip per directory) instead of MDTM per file.

$ErrorActionPreference = "Stop"

# ---- CONFIG ----
$ftpHost    = "69.197.174.151"
$remoteRoot = "/"
$localRoot  = "D:\proj"

$username   = "administrator"
$password   = "nLo9U5t#izz^"

$logMaxBytes      = 500MB
$progressInterval = [TimeSpan]::FromMinutes(10)
# ----------------

$logPath = "D:\proj\Keytech\Sources\Keytech.TestingView\Backup\TestingView_ftp_backup.log"
$cred    = New-Object System.Net.NetworkCredential($username, $password)
$ftpConnectionGroup = "TestingViewSync"

$excludeRelative = @(
  'Keytech\Sources\Keytech.TestingView\Backup\TestingView_ftp_backup.log'
)

$script:currentFile     = '(starting)'
$script:lastProgressAt  = [datetime]::MinValue
$script:logCheckCounter = 0
$script:monthMap = @{
  Jan = 1; Feb = 2; Mar = 3; Apr = 4; May = 5; Jun = 6
  Jul = 7; Aug = 8; Sep = 9; Oct = 10; Nov = 11; Dec = 12
}

[System.Net.ServicePointManager]::DefaultConnectionLimit = 32

function Clear-LogIfTooLarge {
  if (-not (Test-Path -LiteralPath $logPath)) { return }
  $len = (Get-Item -LiteralPath $logPath).Length
  if ($len -gt $logMaxBytes) {
    Clear-Content -LiteralPath $logPath -Force
    $cleared = "[{0}] Log cleared (was {1:N0} bytes, limit {2:N0})" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $len, [int64]$logMaxBytes
    Set-Content -LiteralPath $logPath -Value $cleared
    Write-Host $cleared
  }
}

function Log($msg) {
  $script:logCheckCounter++
  if ($script:logCheckCounter -ge 200) {
    $script:logCheckCounter = 0
    Clear-LogIfTooLarge
  }
  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $msg
  Add-Content -Path $logPath -Value $line
}

function Set-CurrentFile([string]$path) {
  $script:currentFile = $path
  Show-ProgressIfDue
}

function Show-ProgressIfDue([switch]$Force) {
  $now = Get-Date
  if (-not $Force -and ($now - $script:lastProgressAt) -lt $progressInterval) { return }
  $script:lastProgressAt = $now
  $elapsed = ($now - $script:startedAt).TotalMinutes
  $rate = if ($elapsed -gt 0) { [math]::Round($script:filesSeen / $elapsed, 0) } else { 0 }
  $status = ("[{0}] Progress: current={1} | seen={2} down={3} up={4} skip={5} fail={6} | {7}/min" -f `
    $now.ToString("yyyy-MM-dd HH:mm:ss"),
    $script:currentFile,
    $script:filesSeen,
    $script:filesDownloaded,
    $script:filesUploaded,
    $script:filesSkipped,
    $script:filesFailed,
    $rate)
  Write-Host $status
  Clear-LogIfTooLarge
  Add-Content -Path $logPath -Value $status
}

function New-FtpRequest([string]$uri, [string]$method) {
  $request = [System.Net.FtpWebRequest]::Create($uri)
  $request.Method              = $method
  $request.Credentials         = $cred
  $request.UseBinary           = $true
  $request.UsePassive          = $true
  $request.KeepAlive           = $true
  $request.ConnectionGroupName = $ftpConnectionGroup
  $request.Timeout             = 300000
  $request.ReadWriteTimeout    = 300000
  return $request
}

function Get-FtpListing([string]$remoteDir) {
  $uri = "ftp://$ftpHost$remoteDir"
  $request = New-FtpRequest $uri ([System.Net.WebRequestMethods+Ftp]::ListDirectoryDetails)
  $response = $request.GetResponse()
  try {
    $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
    try {
      $lines = New-Object System.Collections.Generic.List[string]
      while ($null -ne ($line = $reader.ReadLine())) {
        if ($line.Trim()) { [void]$lines.Add($line) }
      }
      return $lines
    }
    finally { $reader.Close() }
  }
  finally { $response.Close() }
}

function Get-FtpTimestamp([string]$remotePath) {
  $uri = "ftp://$ftpHost$remotePath"
  $request = New-FtpRequest $uri ([System.Net.WebRequestMethods+Ftp]::GetDateTimestamp)
  $response = $request.GetResponse()
  try { return $response.LastModified.ToUniversalTime() }
  finally { $response.Close() }
}

function ConvertFrom-UnixListDate([string]$month, [string]$day, [string]$timeOrYear) {
  $m = $script:monthMap[$month]
  if (-not $m) { return $null }
  $d = [int]$day

  if ($timeOrYear -match '^\d{1,2}:\d{2}$') {
    $year = (Get-Date).Year
    $parts = $timeOrYear.Split(':')
    $dt = Get-Date -Year $year -Month $m -Day $d -Hour ([int]$parts[0]) -Minute ([int]$parts[1]) -Second 0
    if ($dt -gt (Get-Date).AddDays(2)) { $dt = $dt.AddYears(-1) }
  }
  else {
    $dt = Get-Date -Year ([int]$timeOrYear) -Month $m -Day $d -Hour 0 -Minute 0 -Second 0
  }

  return [datetime]::SpecifyKind($dt, [DateTimeKind]::Local).ToUniversalTime()
}

function Parse-FtpListLine([string]$line) {
  # Unix LIST with date
  if ($line -match '^(?<type>[dl-])(?<perm>[rwxsStT-]{9})\s+(?<links>\d+)\s+(?<user>\S+)\s+(?<group>\S+)\s+(?<size>\d+)\s+(?<mon>\w{3})\s+(?<day>\d{1,2})\s+(?<ty>[\d:]+|\d{4})\s+(?<name>.+)$') {
    $name = $Matches['name']
    if ($name -eq '.' -or $name -eq '..') { return $null }
    return [pscustomobject]@{
      Name        = $name
      IsDirectory = ($Matches['type'] -eq 'd')
      ModifiedUtc = (ConvertFrom-UnixListDate $Matches['mon'] $Matches['day'] $Matches['ty'])
    }
  }

  # MS-DOS LIST with date
  if ($line -match '^(?<date>\d{2}-\d{2}-\d{2})\s+(?<time>\d{1,2}:\d{2}(?:AM|PM))\s+(?<dir><DIR>)?\s*(?<size>\d+)?\s+(?<name>.+)$') {
    $name = $Matches['name']
    if ($name -eq '.' -or $name -eq '..') { return $null }
    $modifiedUtc = $null
    try {
      $dt = [datetime]::ParseExact(
        "$($Matches['date']) $($Matches['time'])",
        'MM-dd-yy h:mmtt',
        [System.Globalization.CultureInfo]::InvariantCulture
      )
      $modifiedUtc = [datetime]::SpecifyKind($dt, [DateTimeKind]::Local).ToUniversalTime()
    }
    catch { }

    return [pscustomobject]@{
      Name        = $name
      IsDirectory = [bool]$Matches['dir']
      ModifiedUtc = $modifiedUtc
    }
  }

  return $null
}

function Join-FtpPath([string]$parent, [string]$child) {
  if ($parent -eq '/' -or $parent -eq '') { return "/$child" }
  return "$($parent.TrimEnd('/'))/$child"
}

function ConvertTo-RemotePath([string]$localPath) {
  $fullLocal = [System.IO.Path]::GetFullPath($localPath)
  $fullRoot  = [System.IO.Path]::GetFullPath($localRoot).TrimEnd('\')
  if (-not $fullLocal.StartsWith($fullRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Local path outside sync root: $localPath"
  }
  $rel = $fullLocal.Substring($fullRoot.Length).TrimStart('\').Replace('\', '/')
  if ([string]::IsNullOrEmpty($rel)) { return '/' }
  return "/$rel"
}

function ConvertTo-LocalPath([string]$remotePath) {
  $relative = $remotePath.TrimStart('/').Replace('/', '\')
  return Join-Path $localRoot $relative
}

function Test-Excluded([string]$localPath) {
  $fullLocal = [System.IO.Path]::GetFullPath($localPath)
  $fullRoot  = [System.IO.Path]::GetFullPath($localRoot).TrimEnd('\')
  if (-not $fullLocal.StartsWith($fullRoot, [System.StringComparison]::OrdinalIgnoreCase)) { return $false }
  $rel = $fullLocal.Substring($fullRoot.Length).TrimStart('\')
  foreach ($ex in $excludeRelative) {
    if ($rel.Equals($ex, [System.StringComparison]::OrdinalIgnoreCase)) { return $true }
  }
  return $false
}

function Ensure-FtpDirectory([string]$remoteDir) {
  if ([string]::IsNullOrEmpty($remoteDir) -or $remoteDir -eq '/') { return }

  $parts = $remoteDir.Trim('/').Split('/')
  $path = ''
  foreach ($part in $parts) {
    $path = "$path/$part"
    if ($script:ftpDirsEnsured.ContainsKey($path)) { continue }

    try {
      $request = New-FtpRequest "ftp://$ftpHost$path" ([System.Net.WebRequestMethods+Ftp]::MakeDirectory)
      $response = $request.GetResponse()
      $response.Close()
    }
    catch { }
    $script:ftpDirsEnsured[$path] = $true
  }
}

function Download-FtpFile([string]$remotePath, [string]$localPath, [datetime]$remoteUtc) {
  $dir = Split-Path $localPath -Parent
  if (-not (Test-Path -LiteralPath $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }

  $request = New-FtpRequest "ftp://$ftpHost$remotePath" ([System.Net.WebRequestMethods+Ftp]::DownloadFile)
  $response = $request.GetResponse()
  try {
    $stream = $response.GetResponseStream()
    try {
      $fs = [System.IO.File]::Open($localPath, [System.IO.FileMode]::Create, [System.IO.FileAccess]::Write, [System.IO.FileShare]::None)
      try {
        $buffer = New-Object byte[] 81920
        while (($read = $stream.Read($buffer, 0, $buffer.Length)) -gt 0) {
          $fs.Write($buffer, 0, $read)
        }
      }
      finally { $fs.Close() }
    }
    finally { $stream.Close() }
  }
  finally { $response.Close() }

  (Get-Item -LiteralPath $localPath).LastWriteTimeUtc = $remoteUtc
}

function Upload-FtpFile([string]$localPath, [string]$remotePath) {
  $parent = Split-Path $remotePath.Replace('/', '\') -Parent
  if ($parent) { Ensure-FtpDirectory ($parent.Replace('\', '/')) }

  $request = New-FtpRequest "ftp://$ftpHost$remotePath" ([System.Net.WebRequestMethods+Ftp]::UploadFile)
  $request.ContentLength = (Get-Item -LiteralPath $localPath).Length

  $fs = [System.IO.File]::Open($localPath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::Read)
  try {
    $stream = $request.GetRequestStream()
    try {
      $buffer = New-Object byte[] 81920
      while (($read = $fs.Read($buffer, 0, $buffer.Length)) -gt 0) {
        $stream.Write($buffer, 0, $read)
      }
    }
    finally { $stream.Close() }
  }
  finally { $fs.Close() }

  $response = $request.GetResponse()
  $response.Close()

  # STOR usually sets remote mtime to server "now", not the local mtime.
  # Read that time (MDTM) and stamp local to match — stops download/upload bounce.
  # Only runs for uploaded files, not for the millions of skip-checks.
  try {
    (Get-Item -LiteralPath $localPath).LastWriteTimeUtc = Get-FtpTimestamp $remotePath
  }
  catch {
    (Get-Item -LiteralPath $localPath).LastWriteTimeUtc = [datetime]::UtcNow
  }
}

function Sync-Pair([string]$remotePath, [string]$localPath, $remoteUtc) {
  if (Test-Excluded $localPath) { return }

  Set-CurrentFile $remotePath
  $script:remoteSeen[$remotePath] = $true
  $script:filesSeen++

  $localExists = Test-Path -LiteralPath $localPath
  $tolerance = [TimeSpan]::FromSeconds(2)

  # MDTM only if LIST had no date (rare)
  if ($null -eq $remoteUtc) {
    try {
      $remoteUtc = Get-FtpTimestamp $remotePath
      $script:mdtmFallback++
    }
    catch {
      if ($localExists) {
        try {
          Log "Uploading (remote ts failed): $localPath -> $remotePath"
          Upload-FtpFile $localPath $remotePath
          Log "OK upload: $remotePath"
          $script:filesUploaded++
        }
        catch {
          Log "ERROR upload: $remotePath - $($_.Exception.Message)"
          $script:filesFailed++
        }
      }
      else {
        Log "SKIP (timestamp failed): $remotePath - $($_.Exception.Message)"
        $script:filesFailed++
      }
      return
    }
  }

  if (-not $localExists) {
    try {
      Log "Downloading (local missing): $remotePath"
      Download-FtpFile $remotePath $localPath $remoteUtc
      Log "OK download: $remotePath ($((Get-Item -LiteralPath $localPath).Length) bytes)"
      $script:filesDownloaded++
    }
    catch {
      Log "ERROR download: $remotePath - $($_.Exception.Message)"
      $script:filesFailed++
    }
    return
  }

  $localUtc = (Get-Item -LiteralPath $localPath).LastWriteTimeUtc

  if ($remoteUtc -gt $localUtc.Add($tolerance)) {
    try {
      Log "Downloading (remote newer): $remotePath"
      Download-FtpFile $remotePath $localPath $remoteUtc
      Log "OK download: $remotePath ($((Get-Item -LiteralPath $localPath).Length) bytes)"
      $script:filesDownloaded++
    }
    catch {
      Log "ERROR download: $remotePath - $($_.Exception.Message)"
      $script:filesFailed++
    }
  }
  elseif ($localUtc -gt $remoteUtc.Add($tolerance)) {
    try {
      Log "Uploading (local newer): $localPath -> $remotePath"
      Upload-FtpFile $localPath $remotePath
      Log "OK upload: $remotePath"
      $script:filesUploaded++
    }
    catch {
      Log "ERROR upload: $remotePath - $($_.Exception.Message)"
      $script:filesFailed++
    }
  }
  else {
    $script:filesSkipped++
  }
}

function Sync-FromRemote([string]$remoteDir) {
  $script:dirsScanned++
  Set-CurrentFile "listing $remoteDir"
  $lines = Get-FtpListing $remoteDir

  foreach ($line in $lines) {
    $entry = Parse-FtpListLine $line
    if (-not $entry) { continue }

    $remotePath = Join-FtpPath $remoteDir $entry.Name
    $localPath  = ConvertTo-LocalPath $remotePath

    if ($entry.IsDirectory) {
      Sync-FromRemote $remotePath
      continue
    }

    Sync-Pair $remotePath $localPath $entry.ModifiedUtc
  }
}

function Sync-LocalOnly {
  Set-CurrentFile "scanning local-only files under $localRoot"
  $files = Get-ChildItem -LiteralPath $localRoot -Recurse -File -Force -ErrorAction SilentlyContinue
  foreach ($file in $files) {
    if (Test-Excluded $file.FullName) { continue }

    $remotePath = ConvertTo-RemotePath $file.FullName
    if ($script:remoteSeen.ContainsKey($remotePath)) { continue }

    Set-CurrentFile $remotePath
    $script:filesSeen++
    try {
      Log "Uploading (local only): $($file.FullName) -> $remotePath"
      Upload-FtpFile $file.FullName $remotePath
      Log "OK upload: $remotePath"
      $script:filesUploaded++
      $script:remoteSeen[$remotePath] = $true
    }
    catch {
      Log "ERROR upload: $remotePath - $($_.Exception.Message)"
      $script:filesFailed++
    }
  }
}

$script:dirsScanned     = 0
$script:filesSeen       = 0
$script:filesDownloaded = 0
$script:filesUploaded   = 0
$script:filesSkipped    = 0
$script:filesFailed     = 0
$script:mdtmFallback    = 0
$script:remoteSeen      = @{}
$script:ftpDirsEnsured  = @{}
$script:startedAt       = Get-Date

try {
  New-Item -ItemType Directory -Path $localRoot -Force | Out-Null
  Clear-LogIfTooLarge
  Log "Starting 2-way sync: ftp://$ftpHost$remoteRoot <-> $localRoot (KeepAlive=on, timestamps from LIST)"
  Show-ProgressIfDue -Force
  Sync-FromRemote $remoteRoot
  Sync-LocalOnly
  Show-ProgressIfDue -Force
  Log ("Done. dirs={0}, seen={1}, downloaded={2}, uploaded={3}, skipped={4}, failed={5}, mdtmFallback={6}" -f `
    $script:dirsScanned, $script:filesSeen, $script:filesDownloaded, $script:filesUploaded, $script:filesSkipped, $script:filesFailed, $script:mdtmFallback)

  if ($script:filesFailed -gt 0) {
    throw "Sync finished with $($script:filesFailed) failed file(s)."
  }
}
catch {
  Log "ERROR: $($_.Exception.Message)"
  throw
}
