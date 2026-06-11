Add-Type -AssemblyName System.Drawing

$files = Get-ChildItem 'f:\测试工具\有关skill技能' -Filter '*.png' | Sort-Object Name

# Load WinRT assemblies
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Media.Ocr.OcrEngine, Windows.Media.Ocr, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime]
$null = [Windows.Storage.Streams, Windows.Storage.Streams, ContentType = WindowsRuntime]

$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
Write-Host "OCR Language: $($engine.RecognizerLanguage.DisplayName)"

foreach ($f in $files) {
    Write-Host "`n========== $($f.Name) =========="
    try {
        $file = Get-Item $f.FullName
        $stream = [System.IO.File]::OpenRead($file.FullName)
        $ras = $stream.AsRandomAccessStream()
        $decoder = [Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($ras).GetAwaiter().GetResult()
        $sbmp = $decoder.GetSoftwareBitmapAsync().GetAwaiter().GetResult()
        $result = $engine.RecognizeAsync($sbmp).GetAwaiter().GetResult()
        Write-Host $result.Text
        $stream.Close()
    } catch {
        Write-Host "ERROR: $_"
    }
}
