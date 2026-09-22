/**
 * Transaction Status & Financial Normalization Utilities
 * 
 * Handles mapping of raw gateway / backend responses to normalized UI states:
 * - 'SUCCESS': Completed / settled / captured / paid transactions
 * - 'CANCELLED': Dynamic QR generated & cancelled/abandoned, aborted, expired, or initiated-only transactions
 * - 'FAILED': Explicit payment failure, declined, or gateway error
 * - 'PENDING': Processing / in-flight transactions (excluding cancelled initiated QRs)
 */

export const resolveTransactionStatus = (t) => {
  if (!t) return 'SUCCESS';

  if (typeof t === 'string') {
    const s = t.trim().toLowerCase();
    if (
      s.includes('initiated') || 
      s.includes('qr_generated') || 
      s.includes('qr generated') || 
      s.includes('qr created') ||
      s.includes('cancel') || 
      s.includes('abort') || 
      s.includes('expired') || 
      s.includes('timeout') ||
      s === 'created'
    ) {
      return 'CANCELLED';
    }
    if (s.includes('success') || s.includes('complete') || s.includes('settle') || s.includes('captured') || s.includes('paid')) {
      return 'SUCCESS';
    }
    if (s.includes('fail') || s.includes('declin') || s.includes('reject') || s.includes('error')) {
      return 'FAILED';
    }
    if (s.includes('pend') || s.includes('process')) {
      return 'PENDING';
    }
    return t.toUpperCase();
  }

  // 1. Gather all potential status and response indicators from backend / gateway payload
  const rawStatus = String(t.status || t.Status || t.transactionStatus || t.TransactionStatus || t.paymentGatewayStatus || '').trim();
  const rawResponse = String(
    t.responseMessage || t.ResponseMessage || 
    t.statusDescription || t.StatusDescription || 
    t.statusDesc || t.StatusDesc || 
    t.gatewayResponse || t.GatewayResponse || 
    t.vendorPostStatus || t.VendorPostStatus || 
    t.remark || t.Remark || 
    t.message || t.Message || 
    t.msg || t.Msg || 
    t.description || t.Description || 
    t.errorDesc || t.ErrorDesc || ''
  ).trim();

  const combined = `${rawStatus} ${rawResponse}`.toLowerCase();

  // 2. Dynamic QR Generated & Cancelled / Initiated states -> CANCELLED
  // (Prevents abandoned / cancelled QR collections showing as confusing 'Pending' or 'Transaction Initiated')
  if (
    combined.includes('initiated') ||
    combined.includes('qr_generated') ||
    combined.includes('qr generated') ||
    combined.includes('qr created') ||
    combined.includes('cancelled') ||
    combined.includes('canceled') ||
    combined.includes('cancel') ||
    combined.includes('abort') ||
    combined.includes('expired') ||
    combined.includes('timeout') ||
    combined.includes('time out') ||
    rawStatus.toLowerCase() === 'initiated' ||
    rawStatus.toLowerCase() === 'transaction initiated' ||
    rawStatus.toLowerCase() === 'qr_generated' ||
    rawStatus.toLowerCase() === 'created'
  ) {
    return 'CANCELLED';
  }

  // 3. Success / Completed / Settled
  if (
    rawStatus.toLowerCase() === 'success' ||
    rawStatus.toLowerCase() === 'completed' ||
    rawStatus.toLowerCase() === 'settled' ||
    rawStatus.toLowerCase() === 'captured' ||
    rawStatus.toLowerCase() === 'paid' ||
    rawStatus.toLowerCase() === 'successful' ||
    (combined.includes('success') && !combined.includes('fail') && !combined.includes('pend')) ||
    (combined.includes('completed') && !combined.includes('fail') && !combined.includes('pend'))
  ) {
    return 'SUCCESS';
  }

  // 4. Failed / Declined / Rejected
  if (
    combined.includes('fail') ||
    combined.includes('declin') ||
    combined.includes('reject') ||
    combined.includes('error') ||
    rawStatus.toLowerCase() === 'failed' ||
    rawStatus.toLowerCase() === 'declined' ||
    rawStatus.toLowerCase() === 'rejected'
  ) {
    return 'FAILED';
  }

  // 5. Pure Pending / In-Flight Processing
  if (
    combined.includes('pend') ||
    combined.includes('process') ||
    rawStatus.toLowerCase() === 'pending' ||
    rawStatus.toLowerCase() === 'processing'
  ) {
    return 'PENDING';
  }

  // 6. Default Fallback
  return rawStatus ? rawStatus.toUpperCase() : 'SUCCESS';
};

export const isTransactionSuccess = (t) => {
  if (!t) return false;
  const status = resolveTransactionStatus(t);
  return status === 'SUCCESS';
};

export const getTransactionStatusClass = (statusOrTx) => {
  const status = typeof statusOrTx === 'object' && statusOrTx !== null
    ? resolveTransactionStatus(statusOrTx)
    : resolveTransactionStatus(statusOrTx);

  switch (status) {
    case 'SUCCESS':
      return 'is-success';
    case 'CANCELLED':
      return 'is-cancelled';
    case 'FAILED':
      return 'is-failed';
    case 'PENDING':
      return 'is-pending';
    default:
      return 'is-pending';
  }
};
