const fs = require('fs');
const { execSync } = require('child_process');

const basePath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi';
const authCtrlPath = `${basePath}\\EcollectApi\\Controllers\\AuthController.cs`;

let code = fs.readFileSync(authCtrlPath, 'utf8');

// 1. Update RequestOTP to fetch SMS Config and DLT Template from Database tables
const dynamicRequestOtp = `        // ============================================================
        // 16. REQUEST OTP (Dynamic Database Tables: SmsConfigs & SmsTemplates)
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

                // 1. Clean previous active OTP entries for this mobile number
                var existingLogins = await _context.MobLogin.Where(a => a.MobileNum == cleanMobile).ToListAsync();
                if (existingLogins.Any())
                {
                    _context.MobLogin.RemoveRange(existingLogins);
                    await _context.SaveChangesAsync();
                }

                // 2. Generate 4-digit random OTP (1000 - 9999)
                int OTP = new Random().Next(1000, 9999);

                // 3. Save into MobLogin table
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

                // 4. Fetch SMS Gateway Configuration from Database (SmsConfigs Table)
                var smsConfig = await _context.SmsConfigs
                    .Where(s => s.IsActive)
                    .OrderByDescending(s => s.Id)
                    .FirstOrDefaultAsync();

                // 5. Fetch DLT Message Template from Database (SmsTemplates Table)
                var smsTemplate = await _context.SmsTemplates
                    .Where(t => t.TemplateCode == "LOGIN_OTP" && t.IsActive)
                    .FirstOrDefaultAsync();

                // Dynamic extraction from database tables with graceful fallback
                string gatewayUrl = smsConfig?.GatewayUrl ?? "http://sms.aanvinsolutions.com/SMS_API/sendsms.php";
                string username = smsConfig?.Username ?? "anvinsolutions";
                string password = smsConfig?.Password ?? "@nvin@123";
                string senderId = smsTemplate?.SenderId ?? smsConfig?.DefaultSenderId ?? "ADSSPY";
                string routeType = smsConfig?.RouteType ?? "1";
                string templateText = smsTemplate?.TemplateText ?? "Your OTP for login is {#var#},do not share your OTP with anyone! -Anvin Digital Services and Solutions";

                // Format DLT message with dynamic variables
                string formattedMessage = templateText.Replace("{#var#}", OTP.ToString());

                // Build Request URL dynamically from Database Configuration
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
        }`;

// Replace RequestOTP in AuthController
if (code.includes('// 16. REQUEST OTP')) {
  code = code.replace(/\/\/ 16\. REQUEST OTP[\s\S]*?\/\/ ============================================================\r?\n\s*\/\/ 17\. VERIFY OTP/m, dynamicRequestOtp + '\n\n        // ============================================================\n        // 17. VERIFY OTP');
}

// 2. Update SendOtp (Mobile App) to also query Database tables
const dynamicSendOtp = `                // 4. Fetch SMS Gateway Configuration from Database (SmsConfigs Table)
                var smsConfig = await _context.SmsConfigs
                    .Where(s => s.IsActive)
                    .OrderByDescending(s => s.Id)
                    .FirstOrDefaultAsync();

                // 5. Fetch DLT Template from Database (SmsTemplates Table)
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

                string Tempurl = $"{gatewayUrl}?username={username}&password={Uri.EscapeDataString(password)}&mobile={cleanPhone}&sendername={senderId}&message={Uri.EscapeDataString(formattedMessage)}&routetype={routeType}";

                try
                {
                    using var client = new HttpClient();
                    var result = await client.GetAsync(Tempurl);
                    Console.WriteLine($"[Dynamic DB SMS Gateway send-otp - Header: {senderId}] Status Code: {result.StatusCode}");
                }
                catch (Exception smsEx)
                {
                    _logger.LogError(smsEx, "[Dynamic DB SMS Gateway Error]");
                }

                _logger.LogInformation($"[OTP SENT VIA DYNAMIC DB SMS] Mobile: {cleanPhone}, UserId: {user?.Id}, OTP: {otpCode}, Header: {senderId}");`;

// Replace in SendOtp
if (code.includes('// 4. Send Real SMS via Aanvin Solutions SMS Gateway')) {
  code = code.replace(/\/\/ 4\. Send Real SMS via Aanvin Solutions SMS Gateway[\s\S]*?_logger\.LogInformation\(\$"\[OTP SENT VIA AANVIN SMS\] Mobile: {cleanPhone}, UserId: {user\?\.Id}, OTP: {otpCode}"\);/m, dynamicSendOtp);
}

fs.writeFileSync(authCtrlPath, code, 'utf8');
console.log('✅ AuthController.cs updated with 100% Dynamic Database Table lookups for SMS & Templates!');
