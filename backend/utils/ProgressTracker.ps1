# ProgressTracker.ps1 - Comprehensive API Client for Learning Progress Tracking

# API Configuration
$script:apiBaseUrl = "http://localhost:5000/api"  # Replace with your actual API URL
$script:accessToken = $null
$script:refreshToken = $null
$script:credentials = @{
    email = $null
    password = $null
}

# Core Functions
function Get-ProgressSummary {
    <#
    .SYNOPSIS
        Gets progress summary matching React's SubjectProgress[]
    #>
    param($email = $credentials.email)
    try {
        $data = Invoke-ApiRequest -Endpoint "progress/summary/$email"
        return $data | Select-Object @(
            'subject_id', 'subject_name', 'total_materials', 
            'completed_materials', @{
                Name='completion_percentage'; 
                Expression={[math]::Round($_.completion_percentage, 2)}
            }
        )
    } catch { throw "Summary error: $_" }
}

function Update-Progress {
    <#
    .SYNOPSIS
        Updates progress status matching React's status types
    #>
    param(
        [Parameter(Mandatory=$true)][int]$SubjectId,
        [Parameter(Mandatory=$true)][int]$MaterialId,
        [ValidateSet("completed", "in-progress", "to-learn", "not-started")]
        [string]$Status
    )
    try {
        $body = @{
            subject_id  = $SubjectId
            material_id = $MaterialId
            status      = $Status
        }
        return Invoke-ApiRequest -Endpoint "progress" -Method POST -Body $body
    } catch { throw "Update error: $_" }
}

function Get-RecentActivity {
    <#
    .SYNOPSIS
        Gets recent learning activities (matches RecentActivity[] in React)
    #>
    param($email = $credentials.email)
    try {
        return Invoke-ApiRequest -Endpoint "progress/recent/$email"
    } catch { throw "Recent activity error: $_" }
}

function Get-ProgressStats {
    <#
    .SYNOPSIS
        Gets stats (matches ProgressStats in React)
    #>
    param($email = $credentials.email)
    try {
        return Invoke-ApiRequest -Endpoint "progress/stats/$email"
    } catch { throw "Stats error: $_" }
}

# Authentication Functions
function Set-Credentials {
    <#
    .SYNOPSIS
        Sets the credentials for API authentication
    #>
    param(
        [Parameter(Mandatory=$true)][string]$Email,
        [Parameter(Mandatory=$true)][string]$Password
    )
    $script:credentials.email = $Email
    $script:credentials.password = ConvertTo-SecureString $Password -AsPlainText -Force
}

function Get-AuthToken {
    <#
    .SYNOPSIS
        Gets initial authentication tokens
    #>
    try {
        $body = @{
            email = $credentials.email
            password = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
                [Runtime.InteropServices.Marshal]::SecureStringToBSTR($credentials.password)
            )
        }
        $response = Invoke-RestMethod -Uri "$apiBaseUrl/auth/login" -Method POST -Body ($body | ConvertTo-Json) -ContentType "application/json"
        
        $script:accessToken = $response.accessToken
        $script:refreshToken = $response.refreshToken
        return $response
    }
    catch {
        throw "Authentication failed: $_"
    }
}

function Update-AuthToken {
    <#
    .SYNOPSIS
        Refresh token logic (matches React's refreshSession)
    #>
    try {
        $response = Invoke-RestMethod -Uri "$apiBaseUrl/auth/refresh" `
            -Method POST `
            -Body (@{ refreshToken = $script:refreshToken } | ConvertTo-Json) `
            -ContentType "application/json"
        
        $script:accessToken = $response.accessToken
        $script:refreshToken = $response.refreshToken
        return $true
    }
    catch {
        Write-Error "Refresh failed: $_"
        return $false
    }
}

# Helper Functions
function Invoke-ApiRequest {
    <#
    .SYNOPSIS
        Unified API request handler with token refresh
    #>
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        [object]$Body = $null
    )
    
    # Token management
    if (-not $script:accessToken) { Get-AuthToken | Out-Null }
    
    $headers = @{
        "Authorization" = "Bearer $script:accessToken"
        "Content-Type" = "application/json"
    }

    try {
        $params = @{
            Uri         = "$apiBaseUrl/$Endpoint"
            Method      = $Method
            Headers     = $headers
            ErrorAction = 'Stop'
        }
        if ($Body) { $params.Body = $Body | ConvertTo-Json -Depth 5 }
        
        return Invoke-RestMethod @params
    }
    catch {
        # Handle 401 Unauthorized
        if ($_.Exception.Response.StatusCode -eq 401) {
            Write-Warning "Token expired. Refreshing..."
            if (-not (Update-AuthToken)) { throw "Refresh failed" }
            $headers.Authorization = "Bearer $script:accessToken"
            return Invoke-RestMethod @params
        }
        throw $_
    }
}

# Export module members
Export-ModuleMember -Function Get-ProgressSummary, Update-Progress, Get-RecentActivity, Get-ProgressStats, Set-Credentials