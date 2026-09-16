const fs = require('fs');
const { execSync } = require('child_process');

console.log('--- Writing AuthDto.cs with OtpRequestDto & UpgradeToMerchantRequestDto ---');

const authDtoPath = 'C:/SOLUTIONS/ECOLLECT/EcollectApi/EcollectApi/EcollectApi/Ecollect.Shared/DTOs/AuthDto.cs';

const cleanAuthDtoContent = `using System.ComponentModel.DataAnnotations;

namespace Ecollect.Shared.DTOs
{
    // ============================================================
    // 1. AUTHENTICATION
    // ============================================================

    public class LoginRequestDto
    {
        [Required(ErrorMessage = "Email or username is required")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        public string Password { get; set; } = string.Empty;

        public string? UsernameOrEmail { get; set; }
        public string? Username { get; set; }

        public bool RememberMe { get; set; } = false;
    }

    public class LoginResponseDto
    {
        public bool IsSuccess { get; set; } = true;
        public string? Message { get; set; }
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? FullName { get; set; }
        public string Role { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
        public string? RefreshToken { get; set; }
        public DateTime ExpiryDate { get; set; }
        public bool IsAuthenticated { get; set; } = true;
        public bool IsActive { get; set; } = true;
        public bool IsEmailVerified { get; set; } = false;
        public bool IsPhoneVerified { get; set; } = false;
        public string? LoginType { get; set; }
        public List<string>? Permissions { get; set; }
        public List<MenuDto>? Menus { get; set; }
        public int? MerchantId { get; set; }
        public int? BranchId { get; set; }
        public int? AgentId { get; set; }
        public string? BranchName { get; set; }
        public string? BranchCode { get; set; }
        public string? MerchantName { get; set; }
        public string? IntegrationStatus { get; set; }
    }

    public class RegisterRequestDto
    {
        [Required(ErrorMessage = "Username is required")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email address")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
        public string Password { get; set; } = string.Empty;

        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Phone { get; set; }

        public int? RoleId { get; set; }
        public int? MerchantId { get; set; }
        public int? BranchId { get; set; }
        public int? AgentId { get; set; }
    }

    public class RegisterResponseDto
    {
        public bool IsSuccess { get; set; } = true;
        public string? Message { get; set; }
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Role { get; set; }
    }

    // ============================================================
    // 2. OTP
    // ============================================================

    public class SendOtpRequestDto
    {
        [Required(ErrorMessage = "Mobile number is required")]
        public string MobileNumber { get; set; } = string.Empty;
    }

    public class OtpRequestDto
    {
        public string? MobileNumber { get; set; }
        public string? MobileNo { get; set; }
        public int? UserId { get; set; }
    }

    public class OtpResponseDto
    {
        public bool IsSuccess { get; set; }
        public string Message { get; set; } = string.Empty;
        public int UserId { get; set; }
        public string MobileNumber { get; set; } = string.Empty;
        public DateTime ExpiryTime { get; set; }
        public int ResendAfterSeconds { get; set; } = 30;
        public string? Otp { get; set; }
    }

    public class OtpVerificationDto
    {
        public int? UserId { get; set; }
        public string? MobileNumber { get; set; }
        public string? MobileNo { get; set; }

        [Required(ErrorMessage = "OTP is required")]
        public string Otp { get; set; } = string.Empty;
    }

    public class ResendOtpRequestDto
    {
        public int? UserId { get; set; }
        public string? MobileNo { get; set; }
        public string? MobileNumber { get; set; }
    }

    // ============================================================
    // 3. PASSWORD
    // ============================================================

    public class ChangePasswordRequestDto
    {
        public string? Username { get; set; }
        public string? CurrentPassword { get; set; }

        [Required(ErrorMessage = "New password is required")]
        [MinLength(6, ErrorMessage = "New password must be at least 6 characters")]
        public string NewPassword { get; set; } = string.Empty;

        public string? ConfirmNewPassword { get; set; }
        public string? ConfirmPassword { get; set; }
        public string? Otp { get; set; }
    }

    public class ChangePasswordResponseDto
    {
        public bool IsSuccess { get; set; }
        public string Message { get; set; } = string.Empty;
        public DateTime ChangedAt { get; set; }
    }

    public class ForgotPasswordRequestDto
    {
        [Required(ErrorMessage = "Email, username, or mobile number is required")]
        public string EmailOrPhone { get; set; } = string.Empty;
    }

    public class ResetPasswordRequestDto
    {
        public int? UserId { get; set; }
        public string? EmailOrPhone { get; set; }
        public string? Username { get; set; }

        [Required(ErrorMessage = "OTP is required")]
        public string Otp { get; set; } = string.Empty;

        [Required(ErrorMessage = "New password is required")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
        public string NewPassword { get; set; } = string.Empty;

        public string? ConfirmPassword { get; set; }
    }

    // ============================================================
    // 4. TOKEN
    // ============================================================

    public class TokenRefreshRequestDto
    {
        [Required(ErrorMessage = "Token is required")]
        public string Token { get; set; } = string.Empty;

        [Required(ErrorMessage = "Refresh token is required")]
        public string RefreshToken { get; set; } = string.Empty;
    }

    public class TokenRefreshResponseDto
    {
        public bool IsSuccess { get; set; }
        public string Message { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime ExpiryDate { get; set; }
    }

    public class ValidateTokenRequestDto
    {
        [Required(ErrorMessage = "Token is required")]
        public string Token { get; set; } = string.Empty;
    }

    public class ValidateTokenResponseDto
    {
        public bool IsValid { get; set; }
        public string Message { get; set; } = string.Empty;
        public int? UserId { get; set; }
        public string? Role { get; set; }
        public DateTime? ExpiryDate { get; set; }
    }

    // ============================================================
    // 5. PROFILE
    // ============================================================

    public class UserProfileDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? FullName { get; set; }
        public string? Phone { get; set; }
        public string? Role { get; set; }
        public bool IsActive { get; set; }
        public bool IsEmailVerified { get; set; }
        public bool IsPhoneVerified { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public int? MerchantId { get; set; }
        public int? BranchId { get; set; }
        public int? AgentId { get; set; }
    }

    public class UpdateProfileRequestDto
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? ProfileImageBase64 { get; set; }
    }

    // ============================================================
    // 6. UPGRADE TO MERCHANT
    // ============================================================

    public class UpgradeToMerchantRequestDto
    {
        [Required(ErrorMessage = "User ID is required")]
        public int UserId { get; set; }
        public string? Notes { get; set; }
        public int? MerchantId { get; set; }
    }

    public class UpgradeToMerchantResponseDto
    {
        public bool IsSuccess { get; set; } = true;
        public string? Message { get; set; }
        public int UserId { get; set; }
        public string? OldRole { get; set; }
        public string? NewRole { get; set; }
        public int? MerchantId { get; set; }
    }

    // ============================================================
    // 7. PERMISSIONS & MENUS
    // ============================================================

    public class MenuDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Icon { get; set; }
        public string? Path { get; set; }
        public int? ParentId { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; }
        public string? Section { get; set; }
        public string? Badge { get; set; }
        public RoleMenuPermissionDto? Permissions { get; set; }
        public List<MenuDto>? Children { get; set; }
    }

    public class RoleMenuPermissionDto
    {
        public bool CanView { get; set; }
        public bool CanCreate { get; set; }
        public bool CanEdit { get; set; }
        public bool CanDelete { get; set; }
        public bool CanExport { get; set; }
    }

    public class MobLRequest
    {
        public string? MobileNo { get; set; }
        public string? MobileNum { get; set; }
        public int? OTP { get; set; }
    }
}
`;

fs.writeFileSync(authDtoPath, cleanAuthDtoContent, 'utf8');
console.log('✅ Updated AuthDto.cs with all classes.');

// Check build
const slnPath = 'C:/SOLUTIONS/ECOLLECT/EcollectApi/EcollectApi/EcollectApi';
try {
  console.log('Building dotnet solution...');
  const buildOut = execSync('dotnet build', { cwd: slnPath, encoding: 'utf8' });
  console.log('🎉 Dotnet build succeeded completely!\n');
  const lines = buildOut.split('\n');
  lines.slice(-6).forEach(l => console.log(l));
} catch (e) {
  console.error('❌ Dotnet build failed:');
  console.error(e.stdout || e.stderr || e.message);
}
