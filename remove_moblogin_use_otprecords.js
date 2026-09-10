const fs = require('fs');
const { execSync } = require('child_process');

const basePath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi';

// 1. Delete MobLogin.cs if it exists
const mobLoginPath = `${basePath}\\Ecollect.Data\\Entities\\MobLogin.cs`;
if (fs.existsSync(mobLoginPath)) {
  fs.unlinkSync(mobLoginPath);
  console.log('✅ Removed redundant MobLogin.cs entity');
}

// 2. Remove DbSet<MobLogin> from ApplicationDbContext.cs
const dbContextPath = `${basePath}\\Ecollect.Data\\Context\\ApplicationDbContext.cs`;
let dbContextCode = fs.readFileSync(dbContextPath, 'utf8');
if (dbContextCode.includes('public DbSet<MobLogin> MobLogin { get; set; }')) {
  dbContextCode = dbContextCode.replace('        public DbSet<MobLogin> MobLogin { get; set; }\n', '');
  fs.writeFileSync(dbContextPath, dbContextCode, 'utf8');
  console.log('✅ Cleaned up DbSet<MobLogin> from ApplicationDbContext.cs');
}

// 3. Update AuthController.cs to use native OtpRecords exclusively
const authCtrlPath = `${basePath}\\EcollectApi\\Controllers\\AuthController.cs`;
let authCode = fs.readFileSync(authCtrlPath, 'utf8');

// Replace RequestOTP and VerifyOTP to use _context.OtpRecords
const cleanRequestOtpAndVerify = `        // ============================================================
        // 16. REQUEST OTP (Native OtpRecords Table + Dynamic DB SMS)
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
                string cleanMobile = mobNumber.Trim().Replace("+91", "").Replace("-", "").Replace(" ", "");

                // 1. Find user by mobile number if exists
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Phone == cleanMobile || u.Username == cleanMobile);

                // 2. Clean previous unused OTP records for this mobile
                var existingOtps = await _context.OtpRecords
                    .Where(r => r.MobileNumber == cleanMobile && !r.IsUsed)
                    .ToListAsync();
                if (existingOtps.Any())
                {
                    _context.OtpRecords.RemoveRange(existingOtps);
                    await _context.SaveChangesAsync();
                }

                // 3. Generate 4-digit random OTP (1000 - 9999)
                int OTP = new Random().Next(1000, 9999);
                string otpCode = OTP.ToString();
                var expiryTime = DateTime.UtcNow.AddMinutes(5);

                // 4. Save into native OtpRecords table
                var otpRecord = new OtpRecord
                {
                    UserId = user?.Id ?? 0,
                    MobileNumber = cleanMobile,
                    Otp = otpCode,
                    ExpiryTime = expiryTime,
                    IsUsed = false,
                    CreatedAt = DateTime.UtcNow,
                    Purpose = "Login"
                };

                await _context.OtpRecords.AddAsync(otpRecord);
                await _context.SaveChangesAsync();

                // 5. Fetch SMS Gateway Configuration & DLT Template from Database
                var smsConfig = await _context.SmsConfigs
                    .Where(s => s.IsActive)
                    .OrderByDescending(s => s.Id)
                    .FirstOrDefaultAsync();

                var smsTemplate = await _context.SmsTemplates
                    .Where(t => t.TemplateCode == "LOGIN_OTP" && t.IsActive)
                    .FirstOrDefaultAsync();

                string gatewayUrl = smsConfig?.GatewayUrl ?? "http://sms.aanvinsolutions.com/SMS_API/sendsms.php";
                string username = smsConfig?.Username ?? "anvinsolutions";
                string password = smsConfig?.Password ?? "@nvin@123";
                string senderId = smsTemplate?.SenderId ?? smsConfig?.DefaultSenderId ?? "ADSSPY";
                string routeType = smsConfig?.RouteType ?? "1";
                string templateText = smsTemplate?.TemplateText ?? "Your OTP for login is {#var#},do not share your OTP with anyone! -Anvin Digital Services and Solutions";

                string formattedMessage = templateText.Replace("{#var#}", otpCode);

                string Tempurl = $"{gatewayUrl}?username={username}&password={Uri.EscapeDataString(password)}&mobile={cleanMobile}&sendername={senderId}&message={Uri.EscapeDataString(formattedMessage)}&routetype={routeType}";

                bool smstatus = false;
                try
                {
                    using var client = new HttpClient();
                    var result = await client.GetAsync(Tempurl);
                    Console.WriteLine($"[Dynamic DB SMS Gateway - Header: {senderId}] Status: {result.StatusCode}");
                    smstatus = true;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "SMS Sending failed");
                    smstatus = false;
                }

                if (smstatus)
                {
                    _logger.LogInformation($"SMS Send Sucessfully to {cleanMobile} using Header: {senderId}");
                    return StatusCode(StatusCodes.Status200OK, new { message = "SMS Send Sucessfully", status = "N", mobileNo = cleanMobile, otp = otpCode });
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
        // 17. VERIFY OTP (Native OtpRecords Table)
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
                string cleanMobile = mobNumber.Trim().Replace("+91", "").Replace("-", "").Replace(" ", "");
                string enteredOtp = mob.OTP.Value.ToString();

                var record = await _context.OtpRecords
                    .Where(r => r.MobileNumber == cleanMobile && r.Otp == enteredOtp && !r.IsUsed && r.ExpiryTime >= DateTime.UtcNow)
                    .OrderByDescending(r => r.CreatedAt)
                    .FirstOrDefaultAsync();

                if (record == null)
                {
                    return Unauthorized(new { success = false, message = "Invalid or expired OTP code", status = "N" });
                }

                // Mark OTP used in OtpRecords table
                record.IsUsed = true;
                await _context.SaveChangesAsync();

                // Find matching user
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
        }`;

// Replace in AuthController
if (authCode.includes('// 16. REQUEST OTP')) {
  authCode = authCode.replace(/\/\/ 16\. REQUEST OTP[\s\S]*?\/\/ ============================================================\r?\n\s*\/\/ 18\. RESEND OTP/m, cleanRequestOtpAndVerify + '\n\n        // ============================================================\n        // 18. RESEND OTP');
  fs.writeFileSync(authCtrlPath, authCode, 'utf8');
  console.log('✅ AuthController.cs updated: MobLogin removed, using native OtpRecords table exclusively!');
}

// Clean frontend smsService.js from MobLogin references as well
const smsServicePath = 'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\services\\smsService.js';
if (fs.existsSync(smsServicePath)) {
  let smsCode = fs.readFileSync(smsServicePath, 'utf8');
  smsCode = smsCode.replace(/ecollect_mob_logins/g, 'ecollect_otp_records');
  smsCode = smsCode.replace(/MobLogin/g, 'OtpRecord');
  fs.writeFileSync(smsServicePath, smsCode, 'utf8');
  console.log('✅ smsService.js updated to use OtpRecords');
}
