$javaHome = 'C:\jdk-25\jdk-25.0.3+9'
$javaBin = $javaHome + '\bin'

[Environment]::SetEnvironmentVariable('JAVA_HOME', $javaHome, 'User')
Write-Host "JAVA_HOME set to: $javaHome"

$path = [Environment]::GetEnvironmentVariable('PATH', 'User')
if ($null -eq $path) { $path = '' }

if ($path -notlike "*$javaBin*") {
    $newPath = $path + ';' + $javaBin
    [Environment]::SetEnvironmentVariable('PATH', $newPath, 'User')
    Write-Host "Added to PATH: $javaBin"
} else {
    Write-Host "PATH already contains JDK bin"
}

Write-Host ""
Write-Host "Done. Close and reopen terminal, then run:"
Write-Host "  java -version"
Write-Host "  cd c:\moneybayts\backend"
Write-Host "  .\mvnw spring-boot:run"
