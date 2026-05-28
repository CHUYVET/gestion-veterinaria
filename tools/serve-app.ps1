param(
    [int]$Port = 5177
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\app")
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
$listener.Start()

Write-Host "Gestion Veterinaria disponible en http://localhost:$Port/"
Write-Host "Presiona Ctrl+C para detener el servidor."

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css" = "text/css; charset=utf-8"
    ".js" = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".webmanifest" = "application/manifest+json; charset=utf-8"
    ".png" = "image/png"
    ".jpg" = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".svg" = "image/svg+xml"
}

function Send-Response {
    param(
        [System.Net.Sockets.NetworkStream]$Stream,
        [int]$StatusCode,
        [string]$StatusText,
        [byte[]]$Body,
        [string]$ContentType = "text/plain; charset=utf-8"
    )

    $header = "HTTP/1.1 $StatusCode $StatusText`r`nContent-Type: $ContentType`r`nContent-Length: $($Body.Length)`r`nCache-Control: no-store, no-cache, must-revalidate, max-age=0`r`nPragma: no-cache`r`nExpires: 0`r`nConnection: close`r`n`r`n"
    $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($header)
    $Stream.Write($headerBytes, 0, $headerBytes.Length)
    if ($Body.Length -gt 0) {
        $Stream.Write($Body, 0, $Body.Length)
    }
}

while ($true) {
    $client = $listener.AcceptTcpClient()
    $client.ReceiveTimeout = 5000
    $client.SendTimeout = 5000
    $stream = $client.GetStream()
    $stream.ReadTimeout = 5000
    $stream.WriteTimeout = 5000
    try {
        $buffer = New-Object byte[] 4096
        $read = $stream.Read($buffer, 0, $buffer.Length)
        if ($read -le 0) {
            $client.Close()
            continue
        }

        $requestText = [System.Text.Encoding]::UTF8.GetString($buffer, 0, $read)
        $requestLine = ($requestText -split "`r`n")[0]
        $parts = $requestLine -split " "
        if ($parts.Length -lt 2 -or $parts[0] -ne "GET") {
            Send-Response $stream 405 "Method Not Allowed" ([System.Text.Encoding]::UTF8.GetBytes("Metodo no permitido"))
            $client.Close()
            continue
        }

        $path = [Uri]::UnescapeDataString($parts[1].Split("?")[0].TrimStart("/"))
        if ([string]::IsNullOrWhiteSpace($path)) {
            $path = "index.html"
        }

        $combined = Join-Path $root $path
        $fullPath = [System.IO.Path]::GetFullPath($combined)
        $rootPath = [System.IO.Path]::GetFullPath($root)

        if (-not $fullPath.StartsWith($rootPath)) {
            Send-Response $stream 403 "Forbidden" ([System.Text.Encoding]::UTF8.GetBytes("Acceso denegado"))
            $client.Close()
            continue
        }

        if (-not [System.IO.File]::Exists($fullPath)) {
            Send-Response $stream 404 "Not Found" ([System.Text.Encoding]::UTF8.GetBytes("Archivo no encontrado"))
            $client.Close()
            continue
        }

        $extension = [System.IO.Path]::GetExtension($fullPath).ToLowerInvariant()
        $contentType = $mimeTypes[$extension]
        if (-not $contentType) {
            $contentType = "application/octet-stream"
        }

        $bytes = [System.IO.File]::ReadAllBytes($fullPath)
        Send-Response $stream 200 "OK" $bytes $contentType
    }
    catch {
        Send-Response $stream 500 "Internal Server Error" ([System.Text.Encoding]::UTF8.GetBytes("Error del servidor"))
    }
    finally {
        $stream.Close()
        $client.Close()
    }
}
