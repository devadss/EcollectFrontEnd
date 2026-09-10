/**
 * AutoPay & Customer EMI Preference Service (Integration Status: N Concept)
 */

const STORAGE_KEY_MANDATES = 'ecollect_autopay_mandates';
const STORAGE_KEY_EMI_PREFS = 'ecollect_customer_emi_preferences';

export const MANDATE_TYPES = [
  { code: 'UPI_AUTOPAY', name: 'UPI AutoPay (GPay / PhonePe / Paytm)', icon: '📱' },
  { code: 'ENACH', name: 'eNACH / NetBanking Mandate', icon: '🏦' },
  { code: 'DEBIT_CARD', name: 'Debit Card Recurring Mandate', icon: '💳' },
  { code: 'STANDING_INSTRUCTION', name: 'Bank Standing Instruction (SI)', icon: '📝' },
];

export const EMI_FREQUENCIES = [
  { code: 'MONTHLY', name: 'Full Monthly EMI', desc: 'Standard single monthly installment' },
  { code: 'WEEKLY', name: 'Weekly Micro-EMI', desc: 'Split into 4 small weekly payments' },
  { code: 'DAILY', name: 'Daily Micro-EMI', desc: 'Split into small daily micro-deductions' },
];

export const autoPayService = {
  /**
   * Get all stored AutoPay mandates
   */
  getMandates() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_MANDATES);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  /**
   * Get mandate for specific account number
   */
  getMandateForAccount(accountNumber) {
    const all = this.getMandates();
    return all[accountNumber] || {
      accountNumber,
      mandateType: 'UPI_AUTOPAY',
      mandateLimit: 5000,
      frequency: 'MONTHLY',
      status: 'PENDING_CUSTOMER_APPROVAL', // 'ACTIVE', 'PENDING_CUSTOMER_APPROVAL', 'REJECTED'
      createdAt: new Date().toISOString()
    };
  },

  /**
   * Create or update AutoPay mandate for account
   */
  saveMandate({ accountNumber, customerName, phone, emiAmount, mandateType = 'UPI_AUTOPAY', mandateLimit = 5000, frequency = 'MONTHLY', status = 'PENDING_CUSTOMER_APPROVAL' }) {
    const all = this.getMandates();
    const updated = {
      ...all,
      [accountNumber]: {
        accountNumber,
        customerName,
        phone,
        emiAmount: Number(emiAmount || 0),
        mandateType,
        mandateLimit: Number(mandateLimit || emiAmount || 5000),
        frequency,
        status,
        updatedAt: new Date().toISOString()
      }
    };
    localStorage.setItem(STORAGE_KEY_MANDATES, JSON.stringify(updated));
    window.dispatchEvent(new Event('autopay_updated'));
    return updated[accountNumber];
  },

  /**
   * Save customer EMI decision (from customer portal link)
   */
  saveCustomerEmiDecision({ accountNumber, selectedFrequency, emiAmount, approveMandate = true }) {
    const mandates = this.getMandates();
    const existing = mandates[accountNumber] || {};
    
    mandates[accountNumber] = {
      ...existing,
      accountNumber,
      frequency: selectedFrequency,
      status: approveMandate ? 'ACTIVE' : 'REJECTED',
      approvedAt: new Date().toISOString()
    };
    
    localStorage.setItem(STORAGE_KEY_MANDATES, JSON.stringify(mandates));

    // Save decision preference log
    try {
      const prefs = JSON.parse(localStorage.getItem(STORAGE_KEY_EMI_PREFS) || '{}');
      prefs[accountNumber] = {
        accountNumber,
        selectedFrequency,
        emiAmount,
        approved: approveMandate,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY_EMI_PREFS, JSON.stringify(prefs));
    } catch (e) {}

    window.dispatchEvent(new Event('autopay_updated'));
    return mandates[accountNumber];
  },

  /**
   * Build Customer EMI Decision Portal URL
   */
  buildCustomerPortalUrl(accountNumber, phone = '') {
    const baseUrl = window.location.origin;
    return `${baseUrl}/customer-pay-decision?acc=${encodeURIComponent(accountNumber)}&phone=${encodeURIComponent(phone)}`;
  },

  /**
   * Build WhatsApp Deep Link with pre-formatted message
   */
  buildWhatsAppMessageLink({ customerName = 'Customer', accountNumber, phone, emiAmount, merchantName = 'eCollect Partner' }) {
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    const portalUrl = this.buildCustomerPortalUrl(accountNumber, cleanPhone);

    const messageText = `Dear ${customerName},

Your Loan/EMI Account #${accountNumber} has been registered with ${merchantName}.

Please select how you would like to pay your EMI (Full Monthly / Micro-EMI) & approve your AutoPay Mandate here:
👇 Click Link:
${portalUrl}

Thank you for choosing automated payment solutions!`;

    const encodedText = encodeURIComponent(messageText);
    const waUrl = cleanPhone.length >= 10 
      ? `https://wa.me/91${cleanPhone.slice(-10)}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;

    return {
      portalUrl,
      waUrl,
      messageText,
      phone: cleanPhone
    };
  },

  /**
   * Batch dispatch WhatsApp links for array of accounts (Bulk import support)
   */
  batchGenerateWhatsAppLinks(accountsList = [], merchantName = 'eCollect Partner') {
    return accountsList.map(acc => {
      const accNum = acc.accountNumber || acc.accNo || acc.id;
      const custName = acc.accountHolder || acc.customerName || acc.name || 'Customer';
      const phone = acc.phone || acc.mobileNumber || acc.mobile || '';
      const emi = acc.dueAmount || acc.demand || acc.emiAmount || 0;

      // Ensure mandate record exists
      this.saveMandate({
        accountNumber: accNum,
        customerName: custName,
        phone,
        emiAmount: emi
      });

      return {
        accountNumber: accNum,
        customerName: custName,
        phone,
        emi,
        ...this.buildWhatsAppMessageLink({
          customerName: custName,
          accountNumber: accNum,
          phone,
          emiAmount: emi,
          merchantName
        })
      };
    });
  }
};

export default autoPayService;
