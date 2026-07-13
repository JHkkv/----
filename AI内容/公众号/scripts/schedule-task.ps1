$taskName = "AI-Daily-Fetch"
$scriptPath = "f:\测试工具\AI内容\公众号\scripts\fetch-daily.js"

$action = New-ScheduledTaskAction -Execute "node" -Argument "`"$scriptPath`""
$trigger = New-ScheduledTaskTrigger -Daily -At "08:15"
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Daily AI news fetch at 8:15 AM" -Force

Write-Host "Task '$taskName' created - daily at 08:15"
