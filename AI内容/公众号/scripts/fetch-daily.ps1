# fetch-daily.ps1 — 拉取AI HOT过去24小时精选，存为每日简报
param(
    [string]$OutputDir = "f:\测试工具\AI公众号\每日简报"
)

$ErrorActionPreference = 'Stop'
$UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 aihot-skill/0.2.0'

$today = (Get-Date).ToUniversalTime().AddHours(8).ToString('yyyy-MM-dd')
$since = (Get-Date).ToUniversalTime().AddHours(-24).ToString('yyyy-MM-ddTHH:mm:ssZ')
$url = "https://aihot.virxact.com/api/public/items?mode=selected&since=$since&take=50"

Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 拉取 AI HOT..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri $url -Headers @{ 'User-Agent' = $UA } -TimeoutSec 30
    $count = $response.items.Count
    Write-Host "  获取到 $count 条精选" -ForegroundColor Green
}
catch {
    Write-Host "  API 请求失败: $_" -ForegroundColor Red
    exit 1
}

if ($count -eq 0) {
    Write-Host "  无新条目，跳过生成" -ForegroundColor Yellow
    exit 0
}

# 构建 markdown
$md = @"
# AI HOT 每日简报 — $today

> 共 $count 条精选 | 数据来源 aihot.virxact.com | 时间窗：过去 24 小时

---

"@

$categories = @{
    'ai-models'  = '模型发布/更新'
    'ai-products' = '产品发布/更新'
    'industry'    = '行业动态'
    'paper'       = '论文研究'
    'tip'         = '技巧与观点'
}

$num = 0
foreach ($cat in $categories.Keys) {
    $items = $response.items | Where-Object { $_.category -eq $cat }
    if (-not $items -or $items.Count -eq 0) { continue }
    $md += "`n## $($categories[$cat])`n`n"
    foreach ($item in $items) {
        $num++
        $title = $item.title
        $source = $item.source -replace '：.*', '' -replace ':.*', ''
        $summary = if ($item.summary) { $item.summary } else { '' }
        if ($summary.Length -gt 120) { $summary = $summary.Substring(0, 120) + '...' }
        $url = $item.url
        $md += "$num. **$title** — $source`n"
        if ($summary) { $md += "   $summary`n" }
        $md += "   $url`n`n"
    }
}

# 写入文件
$outFile = Join-Path $OutputDir "$today.md"
$md | Out-File -FilePath $outFile -Encoding utf8

Write-Host "  简报已保存: $outFile" -ForegroundColor Green
Write-Host "  共 $num 条，分 $($categories.Count) 个版块" -ForegroundColor Green
