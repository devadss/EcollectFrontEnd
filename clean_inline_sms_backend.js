const fs = require('fs');
const { execSync } = require('child_process');

const basePath = 'C:\\SOLUTIONS\\ECOLLECT\\EcollectApi\\EcollectApi\\EcollectApi';
const authCtrlPath = `${basePath}\\EcollectApi\\Controllers\\AuthController.cs`;

let code = fs.readFileSync(authCtrlPath, 'utf8');

// Remove CommonFunt class if present
if (code.includes('public static class CommonFunt')) {
  code = code.replace(/public static class CommonFunt[\s\S]*?public class AuthController/m, 'public class AuthController');
}

// Replace RequestOTP with pure direct inline SMS calling (without CommonFunt)
const inlineRequestOtp = `        // ============================================================
        // 16. REQUEST OTP (Direct Aanvin SMS Gateway - Header: ADSSPY)
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

                // 4. Direct SMS calling with Aanvin Solutions Gateway credentials
                string msg = OTP.ToString();
                string SMStEMP = "Your OTP for login is {#var#},do not share your OTP with anyone! -Anvin Digital Services and Solutions";
                SMStEMP = SMStEMP.Replace("{#var#}", msg);

                string Tempurl = "http://sms.aanvinsolutions.com/SMS_API/sendsms.php?username=anvinsolutions&password=" 
                    + Uri.EscapeDataString("@nvin@123") 
                    + "&mobile=" + cleanMobile 
                    + "&sendername=ADSSPY&message=" 
                    + Uri.EscapeDataString(SMStEMP) 
                    + "&routetype=1";

                bool smstatus = false;
                try
                {
                    using var client = new HttpClient();
                    var result = await client.GetAsync(Tempurl);
                    Console.WriteLine($"[Aanvin SMS Gateway] Status: {result.StatusCode}");
                    smstatus = true;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "SMS Sending failed");
                    smstatus = false;
                }

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
        }`;

// Replace in AuthController
if (code.includes('// 16. REQUEST OTP')) {
  code = code.replace(/\/\/ 16\. REQUEST OTP[\s\S]*?\/\/ ============================================================\r?\n\s*\/\/ 17\. VERIFY OTP/m, inlineRequestOtp + '\n\n        // ============================================================\n        // 17. VERIFY OTP');
}

fs.writeFileSync(authCtrlPath, code, 'utf8');
console.log('✅ AuthController.cs updated with clean direct inline SMS calling');

try {
  const out = execSync('dotnet build', { cwd: basePath, encoding: 'utf8' });
  console.log('✅ Dotnet build succeeded:\n', out);
} catch (err) {
  console.error('❌ Dotnet build output:', err.stdout || err.stderr || err.message);
}
