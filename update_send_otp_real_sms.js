const fs = require('fs');
const { execSync } = require('child_process');

const basePath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi';
const authCtrlPath = `${basePath}\\EcollectApi\\Controllers\\AuthController.cs`;

let code = fs.readFileSync(authCtrlPath, 'utf8');

// Replace the hardcoded SendOtp method with Real Aanvin SMS Gateway Dispatch
const oldSendOtpSection = `                // 3. Generate OTP (123456 for dev/testing)
                string otpCode = "123456";
                var expiryTime = DateTime.UtcNow.AddMinutes(10);

                var otpRecord = new OtpRecord
                {
                    UserId = user?.Id ?? agent?.Id ?? 0,
                    MobileNumber = cleanPhone,
                    Otp = otpCode,
                    ExpiryTime = expiryTime,
                    IsUsed = false,
                    CreatedAt = DateTime.UtcNow,
                    Purpose = "AgentMobileLogin"
                };

                await _context.OtpRecords.AddAsync(otpRecord);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"[OTP SENT] Mobile: {cleanPhone}, UserId: {user?.Id}, OTP: {otpCode}");

                return Ok(new
                {
                    success = true,
                    message = "OTP sent successfully to registered mobile number",
                    userId = user?.Id,
                    mobileNumber = cleanPhone,
                    expiryTime = expiryTime,
                    resendAfterSeconds = 30,
                    otp = otpCode
                });`;

const newSendOtpSection = `                // 3. Generate 4-digit random OTP (1000 - 9999)
                int randomOtp = new Random().Next(1000, 9999);
                string otpCode = randomOtp.ToString();
                var expiryTime = DateTime.UtcNow.AddMinutes(5);

                // Save in OtpRecords table
                var otpRecord = new OtpRecord
                {
                    UserId = user?.Id ?? agent?.Id ?? 0,
                    MobileNumber = cleanPhone,
                    Otp = otpCode,
                    ExpiryTime = expiryTime,
                    IsUsed = false,
                    CreatedAt = DateTime.UtcNow,
                    Purpose = "AgentMobileLogin"
                };
                await _context.OtpRecords.AddAsync(otpRecord);

                // Also save in MobLogin table
                var existingMobLogins = await _context.MobLogin.Where(m => m.MobileNum == cleanPhone).ToListAsync();
                if (existingMobLogins.Any())
                {
                    _context.MobLogin.RemoveRange(existingMobLogins);
                }
                var mobLoginRecord = new MobLogin
                {
                    MobileNum = cleanPhone,
                    OTP = randomOtp,
                    IsVerified = false,
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = expiryTime
                };
                await _context.MobLogin.AddAsync(mobLoginRecord);
                await _context.SaveChangesAsync();

                // 4. Send Real SMS via Aanvin Solutions Gateway (Header: ADSSPY)
                string msg = otpCode;
                string SMStEMP = "Your OTP for login is {#var#},do not share your OTP with anyone! -Anvin Digital Services and Solutions";
                SMStEMP = SMStEMP.Replace("{#var#}", msg);

                string Tempurl = "http://sms.aanvinsolutions.com/SMS_API/sendsms.php?username=anvinsolutions&password=" 
                    + Uri.EscapeDataString("@nvin@123") 
                    + "&mobile=" + cleanPhone 
                    + "&sendername=ADSSPY&message=" 
                    + Uri.EscapeDataString(SMStEMP) 
                    + "&routetype=1";

                try
                {
                    using var client = new HttpClient();
                    var result = await client.GetAsync(Tempurl);
                    Console.WriteLine($"[Aanvin SMS Gateway send-otp] Status Code: {result.StatusCode}");
                }
                catch (Exception smsEx)
                {
                    _logger.LogError(smsEx, $"[Aanvin SMS Gateway Error]: {smsEx.Message}");
                }

                _logger.LogInformation($"[OTP SENT VIA AANVIN SMS] Mobile: {cleanPhone}, UserId: {user?.Id}, OTP: {otpCode}");

                return Ok(new
                {
                    success = true,
                    message = "OTP sent successfully to registered mobile number via SMS",
                    userId = user?.Id,
                    mobileNumber = cleanPhone,
                    expiryTime = expiryTime,
                    resendAfterSeconds = 30,
                    otp = otpCode
                });`;

if (code.includes(oldSendOtpSection)) {
  code = code.replace(oldSendOtpSection, newSendOtpSection);
  fs.writeFileSync(authCtrlPath, code, 'utf8');
  console.log('✅ Updated send-otp with real Aanvin SMS Gateway calling!');
} else {
  console.log('Target block in send-otp not matched, checking structure...');
}

// Compile with dotnet build
console.log('Building backend solution...');
try {
  const buildOut = execSync('dotnet build', { cwd: basePath, encoding: 'utf8' });
  console.log('✅ Dotnet build succeeded:\n', buildOut);
} catch (e) {
  console.error('❌ Dotnet build failed:', e.stdout || e.stderr || e.message);
}
