$ErrorActionPreference = "Stop"

$rootCandidate = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($rootCandidate)) {
    $rootCandidate = Split-Path -Parent $MyInvocation.MyCommand.Path
}
if ([string]::IsNullOrWhiteSpace($rootCandidate)) {
    $rootCandidate = "c:\Users\server\Documents\trae_projects\mcserver\FiveMServer\txData\ESXLegacy_D182B5.base\resources\[hex]\hex_emergency_tablet\web"
}

$root = (Resolve-Path -LiteralPath $rootCandidate).Path
$prefix = "http://localhost:8080/"

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add($prefix)
$listener.Start()

Write-Host ("Serving {0} on {1}" -f $root, $prefix)

while ($listener.IsListening) {
    $context = $listener.GetContext()
    try {
        $requestPath = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart("/"))
        if ([string]::IsNullOrWhiteSpace($requestPath)) {
            $requestPath = "index.html"
        }

        $safeCandidate = $requestPath -replace "/", "\"
        $candidate = [System.IO.Path]::GetFullPath((Join-Path $root $safeCandidate))
        if (-not $candidate.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
            $context.Response.StatusCode = 403
            $context.Response.Close()
            continue
        }

        if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) {
            $context.Response.StatusCode = 404
            $context.Response.Close()
            continue
        }

        $ext = [System.IO.Path]::GetExtension($candidate).ToLowerInvariant()
        switch ($ext) {
            ".html" { $context.Response.ContentType = "text/html; charset=utf-8" }
            ".css" { $context.Response.ContentType = "text/css; charset=utf-8" }
            ".js" { $context.Response.ContentType = "application/javascript; charset=utf-8" }
            ".json" { $context.Response.ContentType = "application/json; charset=utf-8" }
            ".svg" { $context.Response.ContentType = "image/svg+xml" }
            ".png" { $context.Response.ContentType = "image/png" }
            ".jpg" { $context.Response.ContentType = "image/jpeg" }
            ".jpeg" { $context.Response.ContentType = "image/jpeg" }
            ".gif" { $context.Response.ContentType = "image/gif" }
            ".mp3" { $context.Response.ContentType = "audio/mpeg" }
            default { $context.Response.ContentType = "application/octet-stream" }
        }

        $bytes = [System.IO.File]::ReadAllBytes($candidate)
        $context.Response.StatusCode = 200
        $context.Response.ContentLength64 = $bytes.Length
        $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
        $context.Response.OutputStream.Close()
    } catch {
        try {
            $context.Response.StatusCode = 500
            $context.Response.Close()
        } catch {
        }
    }
}
