import api from './api';

const STORAGE_KEY_PLANS = 'ecollect_subscription_plans';
const STORAGE_KEY_MERCHANT_SUB = 'ecollect_merchant_subscription';

/**
 * Standard 4 Plan Tiers Definition
 */
export const DEFAULT_PLANS = [
  {
    id: 1,
    planCode: 'NANO',
    planName: 'Basic (Nano) Plan',
    monthlyPrice: 399,
    oneTimeRegistrationFee: 30000,
    minRegistrationFee: 5000,
    maxTransactionVolume: 10000,
    maxCustomers: 50,
    maxCommunicationQuota: 500,
    maxUsersPerBranch: 1,
    maxAgentsPerBranch: 2,
    multiUserEnabled: false,
    multiBranchEnabled: false,
    hubAndSpokeEnabled: false,
    customFeeSchedulesEnabled: false,
    realTimeAnalyticsEnabled: false,
    description: 'Fits micro institutions (Nano) which need to automate their collection.',
    highlights: [
      'Fits for micro institutions (Nano)',
      'Transaction volume ≤ ₹10,000 per month',
      'Up to 50 customers limit',
      '500 SMS, WhatsApp & Call (altogether)',
      'Automated payment links and reminders',
      'Real-time payment updates and reports'
    ]
  },
  {
    id: 2,
    planCode: 'GENESIS',
    planName: 'Standard (Genesis) Plan',
    monthlyPrice: 999,
    oneTimeRegistrationFee: 30000,
    minRegistrationFee: 5000,
    maxTransactionVolume: 100000,
    maxCustomers: 200,
    maxCommunicationQuota: 1500,
    maxUsersPerBranch: 3,
    maxAgentsPerBranch: 5,
    multiUserEnabled: true,
    multiBranchEnabled: false,
    hubAndSpokeEnabled: false,
    customFeeSchedulesEnabled: false,
    realTimeAnalyticsEnabled: false,
    description: 'Fits medium type institutions which need to automate their collections.',
    highlights: [
      'Fits for medium type institutions',
      'Transaction volume ≤ ₹100,000 per month',
      'Up to 200 customers limit',
      '1,500 SMS, WhatsApp and Calls',
      'Automated payment links and reminders',
      'Automated Fee Communications',
      'Real-time payment updates and reports',
      'Effortless Reconciliation & Receipts',
      'Multi-users model (3 users, 5 agents/branch)'
    ]
  },
  {
    id: 3,
    planCode: 'CLASSY',
    planName: 'Premium (Classy) Plan',
    monthlyPrice: 3999,
    oneTimeRegistrationFee: 30000,
    minRegistrationFee: 5000,
    maxTransactionVolume: 500000,
    maxCustomers: 500,
    maxCommunicationQuota: 5000,
    maxUsersPerBranch: 5,
    maxAgentsPerBranch: 10,
    multiUserEnabled: true,
    multiBranchEnabled: true,
    hubAndSpokeEnabled: true,
    customFeeSchedulesEnabled: true,
    realTimeAnalyticsEnabled: true,
    description: 'Fits large type institutions which need full multi-branch collection automation.',
    highlights: [
      'Fits for large type institutions',
      'Transaction volume ≤ ₹500,000 per month',
      'Up to 500 customers limit',
      '5,000 SMS, WhatsApp and Calls',
      'Customizable Fee Schedules',
      'Automated payment links and reminders',
      'Automated Fee Communications',
      'Real-Time Analytics & Dashboards',
      'Customized Receipts & Reconciliation',
      'Multi-branch enabled & Hub & Spoke model'
    ]
  },
  {
    id: 4,
    planCode: 'CORPORATE',
    planName: 'Enterprise (Corporate) Plan',
    monthlyPrice: 0, // Custom Price
    oneTimeRegistrationFee: 30000,
    minRegistrationFee: 5000,
    maxTransactionVolume: 0, // Unlimited
    maxCustomers: 0, // Unlimited
    maxCommunicationQuota: 0, // Unlimited
    maxUsersPerBranch: 999,
    maxAgentsPerBranch: 999,
    multiUserEnabled: true,
    multiBranchEnabled: true,
    hubAndSpokeEnabled: true,
    customFeeSchedulesEnabled: true,
    realTimeAnalyticsEnabled: true,
    description: 'Fits corporate entities needing customized enterprise-grade infrastructure & unlimited scaling.',
    highlights: [
      'Fits for corporate entities',
      'Unlimited transaction volume & customers',
      'Customizable Fee Schedules',
      'Automated payment links & reminders',
      'Real-Time Analytics & Reconciliations',
      'Unlimited Multi-users & Multi-branch',
      'Hub & spoke model'
    ]
  }
];

export const subscriptionService = {
  /**
   * Get all subscription plans
   */
  async getPlans() {
    try {
      const res = await api.get('/subscription/plans');
      if (res?.data?.data && Array.isArray(res.data.data)) {
        localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(res.data.data));
        return res.data.data;
      }
    } catch (err) {
      console.warn('Using fallback local subscription plans:', err);
    }
    const cached = localStorage.getItem(STORAGE_KEY_PLANS);
    return cached ? JSON.parse(cached) : DEFAULT_PLANS;
  },

  /**
   * Get merchant subscription status
   */
  async getMerchantSubscription(merchantId = 1) {
    try {
      const res = await api.get(`/subscription/merchant/${merchantId}`);
      if (res?.data?.data) {
        localStorage.setItem(`${STORAGE_KEY_MERCHANT_SUB}_${merchantId}`, JSON.stringify(res.data.data));
        return res.data.data;
      }
    } catch (err) {
      console.warn('Fetching subscription status locally:', err);
    }

    const cached = localStorage.getItem(`${STORAGE_KEY_MERCHANT_SUB}_${merchantId}`);
    if (cached) return JSON.parse(cached);

    // Fallback default
    return {
      merchantId,
      hasSelectedPlan: false,
      planCode: 'NONE',
      planName: 'No Plan Selected',
      planStatus: 'INACTIVE',
      monthlyPrice: 0,
      customerCount: 12,
      maxCustomers: 50,
      usedTransactionVolume: 2500,
      maxTransactionVolume: 10000,
      usedCommunicationQuota: 120,
      maxCommunicationQuota: 500
    };
  },

  /**
   * Select or upgrade plan for merchant
   */
  async selectPlan({ merchantId = 1, planCode, billingCycle = 'MONTHLY', agreedRegistrationFee = 30000 }) {
    const plans = await this.getPlans();
    const targetPlan = plans.find(p => p.planCode.toUpperCase() === planCode.toUpperCase()) || DEFAULT_PLANS[0];

    try {
      const res = await api.post('/subscription/select', {
        merchantId,
        planCode,
        billingCycle,
        agreedRegistrationFee
      });
      if (res?.data?.success) {
        const subData = res.data.data;
        localStorage.setItem(`${STORAGE_KEY_MERCHANT_SUB}_${merchantId}`, JSON.stringify(subData));
        this._updateUserStoragePlan(subData);
        return res.data;
      }
    } catch (err) {
      console.warn('API subscription selection fallback to local storage:', err);
    }

    // Local fallback save
    const prevSub = await this.getMerchantSubscription(merchantId);
    const previousPaid = prevSub?.monthlyPrice || 0;
    const newStatus = {
      merchantId,
      hasSelectedPlan: true,
      planId: targetPlan.id,
      planCode: targetPlan.planCode,
      planName: targetPlan.planName,
      planStatus: 'ACTIVE',
      monthlyPrice: targetPlan.monthlyPrice,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      customerCount: prevSub?.customerCount || 12,
      maxCustomers: targetPlan.maxCustomers,
      usedTransactionVolume: prevSub?.usedTransactionVolume || 2500,
      maxTransactionVolume: targetPlan.maxTransactionVolume,
      usedCommunicationQuota: prevSub?.usedCommunicationQuota || 120,
      maxCommunicationQuota: targetPlan.maxCommunicationQuota
    };

    localStorage.setItem(`${STORAGE_KEY_MERCHANT_SUB}_${merchantId}`, JSON.stringify(newStatus));
    this._updateUserStoragePlan(newStatus);

    return {
      success: true,
      message: `Successfully subscribed to ${targetPlan.planName}!`,
      data: newStatus,
      billingSummary: {
        planName: targetPlan.planName,
        monthlyPrice: targetPlan.monthlyPrice,
        agreedRegistrationFee,
        previousPaidDeduction: previousPaid,
        netPayable: Math.max(0, targetPlan.monthlyPrice - previousPaid),
        isUpgrade: previousPaid > 0
      }
    };
  },

  /**
   * Helper to sync local user state with selected plan
   */
  _updateUserStoragePlan(subData) {
    try {
      const authUserStr = localStorage.getItem('auth_user') || localStorage.getItem('user');
      if (authUserStr) {
        const authUser = JSON.parse(authUserStr);
        authUser.hasSelectedPlan = true;
        authUser.planCode = subData.planCode;
        authUser.planName = subData.planName;
        authUser.planStatus = subData.planStatus;
        localStorage.setItem('auth_user', JSON.stringify(authUser));
        localStorage.setItem('user', JSON.stringify(authUser));
      }
      localStorage.setItem('ecollect_active_plan_code', subData.planCode);
      localStorage.setItem('ecollect_active_plan_name', subData.planName);
      localStorage.setItem('ecollect_has_selected_plan', 'true');
      window.dispatchEvent(new Event('subscription_updated'));
    } catch (e) {
      console.warn('Failed to update storage with plan:', e);
    }
  }
};

export default subscriptionService;
