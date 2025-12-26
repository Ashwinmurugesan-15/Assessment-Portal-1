$file = "app\candidate\dashboard\page.tsx"
$content = Get-Content $file -Raw
$content = $content.Replace("&gt;&gt;", "")
Set-Content $file -Value $content -NoNewline
