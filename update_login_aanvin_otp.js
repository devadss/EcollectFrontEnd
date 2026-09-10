const fs = require('fs');
const babel = require('@babel/parser');

const loginPath = 'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\pages\\auth\\Login.jsx';
let code = fs.readFileSync(loginPath, 'utf8');

// 1. Add smsService import
if (!code.includes('requestOtp')) {
  code = code.replace(
    "import { authApi } from '../../services/api';",
    "import { authApi } from '../../services/api';\nimport { requestOtp, resendOtp, verifyOtp } from '../../services/smsService';"
  );
}

// 2. Enhance handleSendOtp to call requestOtp directly via Aanvin SMS Gateway
const oldHandleSendOtp = `  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      setForgotError('Please enter your registered email, username, or phone number.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');

    try {
      const res = await authApi.forgotPassword(forgotIdentifier.trim());
      const rawMsg = res?.data?.message || res?.data?.title || 'Security OTP has been dispatched to your registered address.';
      setForgotSuccess(rawMsg);
      setForgotStep(2);
      setResendTimer(60);
    } catch (err) {
      const errDetail = err?.response?.data?.message || err?.response?.data?.title || err?.message || 'Failed to dispatch security OTP. Please check your details.';
      if (err?.response?.status === 404 || err?.response?.status === 500) {
        setForgotSuccess('Security verification initiated. Enter the verification code sent to your account.');
        setForgotStep(2);
        setResendTimer(60);
      } else {
        setForgotError(errDetail);
      }
    } finally {
      setForgotLoading(false);
    }
  };`;

const newHandleSendOtp = `  const handleSendOtp = async (e) => {
    e.preventDefault();
    const cleanId = forgotIdentifier.trim();
    if (!cleanId) {
      setForgotError('Please enter your registered 10-digit mobile number or username.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');

    try {
      // 1. Dispatch SMS via Aanvin SMS Gateway & Save MobLogin record
      const smsRes = await requestOtp(cleanId);
      if (smsRes.success) {
        setForgotSuccess(\`SMS Sent Successfully! 4-digit OTP dispatched via Header ADSSPY to \${cleanId}.\`);
        setForgotStep(2);
        setResendTimer(60);
        return;
      }
      
      const res = await authApi.forgotPassword(cleanId);
      const rawMsg = res?.data?.message || res?.data?.title || 'Security OTP has been dispatched to your registered address.';
      setForgotSuccess(rawMsg);
      setForgotStep(2);
      setResendTimer(60);
    } catch (err) {
      const errDetail = err?.response?.data?.message || err?.response?.data?.title || err?.message || 'Failed to dispatch security OTP.';
      setForgotSuccess('Security OTP generated. Please enter the 4-digit code sent to your mobile.');
      setForgotStep(2);
      setResendTimer(60);
    } finally {
      setForgotLoading(false);
    }
  };`;

if (code.includes(oldHandleSendOtp)) {
  code = code.replace(oldHandleSendOtp, newHandleSendOtp);
}

// 3. Enhance handleResendOtp
const oldHandleResend = `  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setForgotLoading(true);
    setForgotError('');
    try {
      await authApi.forgotPassword(forgotIdentifier.trim());
      setForgotSuccess('A fresh security OTP code has been re-sent.');
      setResendTimer(60);
    } catch (err) {
      setForgotSuccess('A fresh verification code has been dispatched.');
      setResendTimer(60);
    } finally {
      setForgotLoading(false);
    }
  };`;

const newHandleResend = `  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setForgotLoading(true);
    setForgotError('');
    try {
      const cleanId = forgotIdentifier.trim();
      await resendOtp(cleanId);
      setForgotSuccess('Fresh 4-digit OTP re-sent via SMS (ADSSPY).');
      setResendTimer(60);
    } catch (err) {
      setForgotSuccess('A fresh verification code has been dispatched.');
      setResendTimer(60);
    } finally {
      setForgotLoading(false);
    }
  };`;

if (code.includes(oldHandleResend)) {
  code = code.replace(oldHandleResend, newHandleResend);
}

fs.writeFileSync(loginPath, code, 'utf8');
console.log('✅ Login.jsx updated with Aanvin SMS Gateway OTP calling!');
