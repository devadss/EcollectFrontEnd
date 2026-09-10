const fs = require('fs');

const basePath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi';
const authCtrlPath = `${basePath}\\EcollectApi\\Controllers\\AuthController.cs`;
let code = fs.readFileSync(authCtrlPath, 'utf8');

// Replace the OTP generation and return block inside SendOtp
const oldSection = `                // 3. Generate OTP (123456 for dev/testing)
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

const newSection = `                // 3. Generate 4-digit random OTP (1000 - 9999)
                int randomOtp = new Random().Next(1000, 9999);
                string otpCode = randomOtp.ToString();
                var expiryTime = DateTime.UtcNow.AddMinutes(5);

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

                // Save in MobLogin table as well
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

                // 4. Send Real SMS via Aanvin Solutions SMS Gateway (Header: ADSSPY)
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
                    _logger.LogError(smsEx, "[Aanvin SMS Gateway Error]");
                }

                _logger.LogInformation($"[OTP SENT VIA AANVIN SMS] Mobile: {cleanPhone}, UserId: {user?.Id}, OTP: {otpCode}");

                return Ok(new
                {
                    success = true,
                    message = "SMS Send Sucessfully",
                    status = "N",
                    userId = user?.Id,
                    mobileNumber = cleanPhone,
                    expiryTime = expiryTime,
                    resendAfterSeconds = 30,
                    otp = otpCode
                });`;

// Normalize newlines and replace
const normCode = code.replace(/\r\n/g, '\n');
const normOld = oldSection.replace(/\r\n/g, '\n');
const normNew = newSection.replace(/\r\n/g, '\n');

if (normCode.includes(normOld)) {
  const updated = normCode.replace(normOld, normNew);
  fs.writeFileSync(authCtrlPath, updated.replace(/\n/g, '\r\n'), 'utf8');
  console.log('✅ SendOtp in AuthController.cs successfully updated with real SMS dispatch via Aanvin Gateway!');
} else {
  console.log('Normalized search did not match directly, searching substring...');
  const needle = '// 3. Generate OTP (123456 for dev/testing)';
  const needleIdx = normCode.indexOf(needle);
  if (needleIdx !== -1) {
    const endReturnIdx = normCode.indexOf('return Ok(new\n                {\n                    success = true,', needleIdx);
    const endOfReturn = normCode.indexOf('});', endReturnIdx) + 3;
    const toReplace = normCode.substring(needleIdx, endOfReturn);
    const updated = normCode.replace(toReplace, normNew.trim());
    fs.writeFileSync(authCtrlPath, updated.replace(/\n/g, '\r\n'), 'utf8');
    console.log('✅ SendOtp replaced by substring matching!');
  }
}
