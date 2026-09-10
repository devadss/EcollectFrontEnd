const fs = require('fs');
const { execSync } = require('child_process');

const basePath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi';

// 1. Create MobLogin.cs entity
const mobLoginEntityPath = `${basePath}\\Ecollect.Data\\Entities\\MobLogin.cs`;
const mobLoginEntityCode = `using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ecollect.Data.Entities
{
    [Table("MobLogin")]
    public class MobLogin
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [MaxLength(20)]
        public string MobileNum { get; set; } = string.Empty;

        [Required]
        public int OTP { get; set; }

        public int Attempts { get; set; } = 0;

        public bool IsVerified { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddMinutes(5);
    }
}
`;
fs.writeFileSync(mobLoginEntityPath, mobLoginEntityCode, 'utf8');
console.log('✅ Created MobLogin.cs entity');

// 2. Update ApplicationDbContext.cs
const dbContextPath = `${basePath}\\Ecollect.Data\\Context\\ApplicationDbContext.cs`;
let dbContextCode = fs.readFileSync(dbContextPath, 'utf8');

if (!dbContextCode.includes('DbSet<MobLogin>')) {
  dbContextCode = dbContextCode.replace(
    'public DbSet<UserToken> UserTokens { get; set; }',
    'public DbSet<UserToken> UserTokens { get; set; }\n        public DbSet<MobLogin> MobLogin { get; set; }'
  );
  fs.writeFileSync(dbContextPath, dbContextCode, 'utf8');
  console.log('✅ Added DbSet<MobLogin> to ApplicationDbContext.cs');
}

// 3. Update AuthDto.cs with MobLRequest
const authDtoPath = `${basePath}\\Ecollect.Shared\\DTOs\\AuthDto.cs`;
let authDtoCode = fs.readFileSync(authDtoPath, 'utf8');

if (!authDtoCode.includes('class MobLRequest')) {
  const mobLDto = `
    public class MobLRequest
    {
        public string? MobileNo { get; set; }
        public string? MobileNum { get; set; }
        public int? OTP { get; set; }
    }
`;
  authDtoCode = authDtoCode.trimEnd() + '\n' + mobLDto + '\n';
  fs.writeFileSync(authDtoPath, authDtoCode, 'utf8');
  console.log('✅ Added MobLRequest DTO to AuthDto.cs');
}

// 4. Update AuthController.cs with CommonFunt, RequestOTP, VerifyOTP, and ResendOTP
const authCtrlPath = `${basePath}\\EcollectApi\\Controllers\\AuthController.cs`;
let authCtrlCode = fs.readFileSync(authCtrlPath, 'utf8');

if (!authCtrlCode.includes('CommonFunt')) {
  // Add CommonFunt class before or inside namespace
  const commonFuntClass = `
    public static class CommonFunt
    {
        public static async Task<bool> SendOTPAsync(string mobnum, int otp)
        {
            string msg = otp.ToString();
            string SMStEMP = "Your OTP for login is {#var#},do not share your OTP with anyone! -Anvin Digital Services and Solutions";
            SMStEMP = SMStEMP.Replace("{#var#}", msg);

            // Aanvin Solutions SMS Gateway URL
            string Tempurl = "http://sms.aanvinsolutions.com/SMS_API/sendsms.php?username=anvinsolutions&password=" 
                + Uri.EscapeDataString("@nvin@123") 
                + "&mobile=" + mobnum 
                + "&sendername=ADSSPY&message=" 
                + Uri.EscapeDataString(SMStEMP) 
                + "&routetype=1";

            try
            {
                using var client = new HttpClient();
                var result = await client.GetAsync(Tempurl);
                Console.WriteLine($"[Aanvin SMS Gateway] Status Code: {result.StatusCode}");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Aanvin SMS Gateway Error]: {ex.Message}");
                return false;
            }
        }
    }
`;

  // Inject endpoints before end of AuthController class
  const otpEndpoints = `
        // ============================================================
        // 16. REQUEST OTP (Aanvin SMS Gateway ADSSPY)
        // ============================================================
        [AllowAnonymous]
        [HttpPost("RequestOTP")]
        [HttpPost("/api/RequestOTP")]
        public async Task<IActionResult> RequestOTP([FromBody] MobLRequest mob)
        {
            var mobNumber = mob?.MobileNo ?? mob?.MobileNum ?? "";
            if (string.IsNullOrWhiteSpace(mobNumber))
            {
                _logger.LogError("Enter Mobile Number");
                return StatusCode(StatusCodes.Status400BadRequest, new { message = "Enter Mobile Number", status = "N" });
            }

            try
            {
                string cleanMobile = mobNumber.Trim();

                // Clean previous active OTPs for this mobile
                var existingLogins = await _context.MobLogin.Where(a => a.MobileNum == cleanMobile).ToListAsync();
                if (existingLogins.Any())
                {
                    _context.MobLogin.RemoveRange(existingLogins);
                    await _context.SaveChangesAsync();
                }

                // Generate 4-digit random OTP (1000 - 9999)
                int OTP = new Random().Next(1000, 9999);

                MobLogin mdata = new MobLogin
                {
                    MobileNum = cleanMobile,
                    OTP = OTP,
                    IsVerified = false,
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddMinutes(5)
                };

                _context.MobLogin.Add(mdata);
                await _context.SaveChangesAsync();

                // Send SMS via Aanvin Gateway (Header: ADSSPY)
                bool smstatus = await CommonFunt.SendOTPAsync(mdata.MobileNum, mdata.OTP);

                if (smstatus)
                {
                    _logger.LogInformation($"SMS Send Sucessfully: {cleanMobile}");
                    return StatusCode(StatusCodes.Status200OK, new { message = "SMS Send Sucessfully", status = "N", mobileNo = cleanMobile });
                }
                else
                {
                    _logger.LogError($"Failed to Request OTP: {cleanMobile}");
                    return StatusCode(StatusCodes.Status401Unauthorized, new { message = "Failed to Request OTP", status = "N" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in RequestOTP: {ex.Message}");
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Failed to Request OTP", status = "N" });
            }
        }

        // ============================================================
        // 17. VERIFY OTP
        // ============================================================
        [AllowAnonymous]
        [HttpPost("VerifyOTP")]
        [HttpPost("/api/VerifyOTP")]
        public async Task<IActionResult> VerifyOTP([FromBody] MobLRequest mob)
        {
            var mobNumber = mob?.MobileNo ?? mob?.MobileNum ?? "";
            if (string.IsNullOrWhiteSpace(mobNumber) || !mob.OTP.HasValue)
            {
                return BadRequest(new { success = false, message = "Mobile Number and OTP are required", status = "N" });
            }

            try
            {
                string cleanMobile = mobNumber.Trim();
                int enteredOtp = mob.OTP.Value;

                var record = await _context.MobLogin
                    .Where(a => a.MobileNum == cleanMobile && a.OTP == enteredOtp && !a.IsVerified)
                    .OrderByDescending(a => a.CreatedAt)
                    .FirstOrDefaultAsync();

                if (record == null || record.ExpiresAt < DateTime.UtcNow)
                {
                    return Unauthorized(new { success = false, message = "Invalid or expired OTP code", status = "N" });
                }

                // Mark verified
                record.IsVerified = true;
                await _context.SaveChangesAsync();

                // Find or create user associated with this mobile number
                var user = await _context.Users
                    .Include(u => u.Role)
                    .Include(u => u.Merchant)
                    .Include(u => u.Branch)
                    .Include(u => u.Agent)
                    .FirstOrDefaultAsync(u => u.Phone == cleanMobile || u.Username == cleanMobile);

                string token = "";
                string refreshToken = "";
                List<MenuDto> menus = new List<MenuDto>();

                if (user != null)
                {
                    token = GenerateJwtToken(user);
                    refreshToken = GenerateRefreshToken();
                    menus = await _authService.GetUserMenusAsync(user.Id) ?? new List<MenuDto>();

                    var userToken = new UserToken
                    {
                        UserId = user.Id,
                        Token = token,
                        RefreshToken = refreshToken,
                        ExpiryDate = DateTime.UtcNow.AddHours(2),
                        CreatedAt = DateTime.UtcNow,
                        IsRevoked = false
                    };
                    _context.UserTokens.Add(userToken);
                    await _context.SaveChangesAsync();
                }

                return Ok(new
                {
                    success = true,
                    message = "OTP Verified Successfully",
                    status = "Y",
                    token = token,
                    refreshToken = refreshToken,
                    user = user != null ? new
                    {
                        user.Id,
                        user.FirstName,
                        user.LastName,
                        FullName = $"{user.FirstName} {user.LastName}".Trim(),
                        user.Email,
                        user.Phone,
                        user.Username,
                        Role = user.Role?.Name ?? "Agent",
                        user.IsActive,
                        user.MerchantId,
                        user.BranchId,
                        user.AgentId,
                        MerchantName = user.Merchant?.MerchantName,
                        BranchName = user.Branch?.Name
                    } : null,
                    menus = menus
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in VerifyOTP");
                return StatusCode(500, new { success = false, message = ex.Message, status = "N" });
            }
        }

        // ============================================================
        // 18. RESEND OTP
        // ============================================================
        [AllowAnonymous]
        [HttpPost("ResendOTP")]
        [HttpPost("/api/ResendOTP")]
        public async Task<IActionResult> ResendOTP([FromBody] MobLRequest mob)
        {
            return await RequestOTP(mob);
        }
`;

  // Place CommonFunt before AuthController and endpoints before closing brace
  authCtrlCode = authCtrlCode.replace(
    'public class AuthController : ControllerBase',
    commonFuntClass + '\n    public class AuthController : ControllerBase'
  );

  const lastBraceIdx = authCtrlCode.lastIndexOf('}');
  const secondLastBraceIdx = authCtrlCode.lastIndexOf('}', lastBraceIdx - 1);

  authCtrlCode = authCtrlCode.substring(0, secondLastBraceIdx) + otpEndpoints + '\n    }\n}\n';

  fs.writeFileSync(authCtrlPath, authCtrlCode, 'utf8');
  console.log('✅ AuthController.cs updated with RequestOTP, VerifyOTP, ResendOTP and CommonFunt');
}

// 5. Test dotnet build
console.log('Running dotnet build on backend solution...');
try {
  const buildOut = execSync('dotnet build', { cwd: basePath, encoding: 'utf8' });
  console.log('✅ Dotnet build succeeded:\n', buildOut);
} catch (e) {
  console.error('❌ Dotnet build output:');
  console.error(e.stdout || e.stderr || e.message);
}
