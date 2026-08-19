param(
  [Parameter(Mandatory = $true)]
  [string]$InputPath
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Add-Type -AssemblyName System.Runtime.WindowsRuntime

$storageFileType = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
$fileAccessModeType = [Windows.Storage.FileAccessMode, Windows.Storage, ContentType = WindowsRuntime]
$randomAccessStreamType = [Windows.Storage.Streams.IRandomAccessStream, Windows.Storage.Streams, ContentType = WindowsRuntime]
$bitmapDecoderType = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime]
$softwareBitmapType = [Windows.Graphics.Imaging.SoftwareBitmap, Windows.Graphics.Imaging, ContentType = WindowsRuntime]
$ocrEngineType = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
$ocrResultType = [Windows.Media.Ocr.OcrResult, Windows.Foundation, ContentType = WindowsRuntime]

function Await-Result($Operation, [Type]$ResultType) {
  $method = [System.WindowsRuntimeSystemExtensions].GetMethods() |
    Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 } |
    Select-Object -First 1
  $task = $method.MakeGenericMethod($ResultType).Invoke($null, @($Operation))
  try {
    $task.Wait()
  }
  catch {
    throw $task.Exception.InnerException
  }
  return $task.Result
}

$resolvedInput = (Resolve-Path -LiteralPath $InputPath).Path
$temporaryInput = Join-Path $env:TEMP ("milo-ocr-" + [Guid]::NewGuid().ToString('N') + '.png')

try {
  Copy-Item -LiteralPath $resolvedInput -Destination $temporaryInput -Force
  $file = Await-Result ($storageFileType::GetFileFromPathAsync($temporaryInput)) $storageFileType
  $stream = Await-Result ($file.OpenAsync($fileAccessModeType::Read)) $randomAccessStreamType
  $decoder = Await-Result ($bitmapDecoderType::CreateAsync($stream)) $bitmapDecoderType
  $bitmap = Await-Result ($decoder.GetSoftwareBitmapAsync()) $softwareBitmapType
  $engine = $ocrEngineType::TryCreateFromUserProfileLanguages()
  if ($null -eq $engine) {
    throw 'Windows OCR English engine is unavailable.'
  }
  $result = Await-Result ($engine.RecognizeAsync($bitmap)) $ocrResultType

  $lines = @($result.Lines | ForEach-Object {
    $line = $_
    $words = @($line.Words | ForEach-Object {
      $rect = $_.BoundingRect
      [ordered]@{
        text = $_.Text
        x = [math]::Round($rect.X, 2)
        y = [math]::Round($rect.Y, 2)
        width = [math]::Round($rect.Width, 2)
        height = [math]::Round($rect.Height, 2)
      }
    })
    [ordered]@{
      text = $line.Text
      words = $words
    }
  })

  [ordered]@{
    engine = 'windows-media-ocr'
    language = $engine.RecognizerLanguage.LanguageTag
    width = $bitmap.PixelWidth
    height = $bitmap.PixelHeight
    text = $result.Text
    lines = $lines
  } | ConvertTo-Json -Depth 8 -Compress
}
finally {
  if (Test-Path -LiteralPath $temporaryInput) {
    Remove-Item -LiteralPath $temporaryInput -Force
  }
}
