// ============================================================
// INDIAN BANKING DIRECTORY & IFSC LOOKUP SERVICE
// ============================================================

/**
 * Curated list of major Indian Public, Private, Small Finance, and Payment Banks
 */
export const INDIAN_BANKS_LIST = [
  { name: 'State Bank of India', code: 'SBIN', ifscPrefix: 'SBIN', type: 'Public' },
  { name: 'HDFC Bank', code: 'HDFC', ifscPrefix: 'HDFC', type: 'Private' },
  { name: 'ICICI Bank', code: 'ICIC', ifscPrefix: 'ICIC', type: 'Private' },
  { name: 'Axis Bank', code: 'UTIB', ifscPrefix: 'UTIB', type: 'Private' },
  { name: 'Kotak Mahindra Bank', code: 'KKBK', ifscPrefix: 'KKBK', type: 'Private' },
  { name: 'Punjab National Bank', code: 'PUNB', ifscPrefix: 'PUNB', type: 'Public' },
  { name: 'Bank of Baroda', code: 'BARB', ifscPrefix: 'BARB', type: 'Public' },
  { name: 'Canara Bank', code: 'CNRB', ifscPrefix: 'CNRB', type: 'Public' },
  { name: 'Union Bank of India', code: 'UBIN', ifscPrefix: 'UBIN', type: 'Public' },
  { name: 'IndusInd Bank', code: 'INDB', ifscPrefix: 'INDB', type: 'Private' },
  { name: 'Yes Bank', code: 'YESB', ifscPrefix: 'YESB', type: 'Private' },
  { name: 'IDBI Bank', code: 'IBKL', ifscPrefix: 'IBKL', type: 'Private' },
  { name: 'Federal Bank', code: 'FDRL', ifscPrefix: 'FDRL', type: 'Private' },
  { name: 'Bank of India', code: 'BKID', ifscPrefix: 'BKID', type: 'Public' },
  { name: 'Indian Bank', code: 'IDIB', ifscPrefix: 'IDIB', type: 'Public' },
  { name: 'Central Bank of India', code: 'CBIN', ifscPrefix: 'CBIN', type: 'Public' },
  { name: 'Indian Overseas Bank', code: 'IOBA', ifscPrefix: 'IOBA', type: 'Public' },
  { name: 'UCO Bank', code: 'UCBA', ifscPrefix: 'UCBA', type: 'Public' },
  { name: 'Bank of Maharashtra', code: 'MAHB', ifscPrefix: 'MAHB', type: 'Public' },
  { name: 'Punjab & Sind Bank', code: 'PSIB', ifscPrefix: 'PSIB', type: 'Public' },
  { name: 'IDFC FIRST Bank', code: 'IDFB', ifscPrefix: 'IDFB', type: 'Private' },
  { name: 'Bandhan Bank', code: 'BDBL', ifscPrefix: 'BDBL', type: 'Private' },
  { name: 'RBL Bank', code: 'RATN', ifscPrefix: 'RATN', type: 'Private' },
  { name: 'South Indian Bank', code: 'SIBL', ifscPrefix: 'SIBL', type: 'Private' },
  { name: 'Karur Vysya Bank', code: 'KVBL', ifscPrefix: 'KVBL', type: 'Private' },
  { name: 'City Union Bank', code: 'CIUB', ifscPrefix: 'CIUB', type: 'Private' },
  { name: 'Karnataka Bank', code: 'KARB', ifscPrefix: 'KARB', type: 'Private' },
  { name: 'Tamilnad Mercantile Bank', code: 'TMBL', ifscPrefix: 'TMBL', type: 'Private' },
  { name: 'Dhanlaxmi Bank', code: 'DLXB', ifscPrefix: 'DLXB', type: 'Private' },
  { name: 'CSB Bank', code: 'CSBK', ifscPrefix: 'CSBK', type: 'Private' },
  { name: 'Jammu & Kashmir Bank', code: 'JAKA', ifscPrefix: 'JAKA', type: 'Private' },
  { name: 'AU Small Finance Bank', code: 'AUBL', ifscPrefix: 'AUBL', type: 'Small Finance' },
  { name: 'Equitas Small Finance Bank', code: 'ESFB', ifscPrefix: 'ESFB', type: 'Small Finance' },
  { name: 'Ujjivan Small Finance Bank', code: 'UJVN', ifscPrefix: 'UJVN', type: 'Small Finance' },
  { name: 'Jana Small Finance Bank', code: 'JSFB', ifscPrefix: 'JSFB', type: 'Small Finance' },
  { name: 'Suryoday Small Finance Bank', code: 'SURY', ifscPrefix: 'SURY', type: 'Small Finance' },
  { name: 'Utkarsh Small Finance Bank', code: 'UTKS', ifscPrefix: 'UTKS', type: 'Small Finance' },
  { name: 'Capital Small Finance Bank', code: 'CLBL', ifscPrefix: 'CLBL', type: 'Small Finance' },
  { name: 'Fincare Small Finance Bank', code: 'FSCB', ifscPrefix: 'FSCB', type: 'Small Finance' },
  { name: 'Shivalik Small Finance Bank', code: 'SMCB', ifscPrefix: 'SMCB', type: 'Small Finance' },
  { name: 'Airtel Payments Bank', code: 'AIRP', ifscPrefix: 'AIRP', type: 'Payment' },
  { name: 'India Post Payments Bank', code: 'IPOS', ifscPrefix: 'IPOS', type: 'Payment' },
  { name: 'Fino Payments Bank', code: 'FINO', ifscPrefix: 'FINO', type: 'Payment' },
  { name: 'Paytm Payments Bank', code: 'PYTM', ifscPrefix: 'PYTM', type: 'Payment' },
  { name: 'Jio Payments Bank', code: 'JIOP', ifscPrefix: 'JIOP', type: 'Payment' },
  { name: 'NSDL Payments Bank', code: 'NSPB', ifscPrefix: 'NSPB', type: 'Payment' },
];

// In-memory caching for ultra-fast repeated lookups
const ifscCache = new Map();

/**
 * Standard Indian Financial System Code (IFSC) Regex:
 * 4 letters (Bank Code) + 0 (Reserved) + 6 alphanumeric characters (Branch Code)
 */
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

/**
 * Validate IFSC code format
 * @param {string} ifsc 
 * @returns {boolean}
 */
export const validateIFSC = (ifsc) => {
  if (!ifsc || typeof ifsc !== 'string') return false;
  return IFSC_REGEX.test(ifsc.trim().toUpperCase());
};

/**
 * Get all supported Indian Banks
 * @returns {Array<{name: string, code: string, ifscPrefix: string, type: string}>}
 */
export const getIndianBanks = () => {
  return INDIAN_BANKS_LIST;
};

/**
 * Search banks by name or code
 * @param {string} query 
 * @returns {Array}
 */
export const searchBanks = (query) => {
  if (!query) return INDIAN_BANKS_LIST;
  const q = query.toLowerCase().trim();
  return INDIAN_BANKS_LIST.filter(
    (b) =>
      b.name.toLowerCase().includes(q) ||
      b.code.toLowerCase().includes(q) ||
      b.ifscPrefix.toLowerCase().includes(q)
  );
};

/**
 * Common API to Lookup IFSC details (Bank Name, Branch, City, State, Address, Rails)
 * Uses the industry standard Razorpay public IFSC API
 * @param {string} ifscCode 
 * @returns {Promise<{success: boolean, data?: object, message?: string}>}
 */
export const lookupIFSC = async (ifscCode) => {
  if (!ifscCode || typeof ifscCode !== 'string') {
    return { success: false, message: 'IFSC Code is required.' };
  }

  const cleanIfsc = ifscCode.trim().toUpperCase();

  if (cleanIfsc.length !== 11) {
    return { success: false, message: 'IFSC Code must be exactly 11 characters long.' };
  }

  if (!IFSC_REGEX.test(cleanIfsc)) {
    return { 
      success: false, 
      message: 'Invalid IFSC format. IFSC must have 4 letters, followed by 0, and 6 alphanumeric characters (e.g. HDFC0001892).' 
    };
  }

  // Check cache first
  if (ifscCache.has(cleanIfsc)) {
    console.log('⚡ Retrieved IFSC from cache:', cleanIfsc);
    return { success: true, data: ifscCache.get(cleanIfsc), fromCache: true };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`https://ifsc.razorpay.com/${cleanIfsc}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        return { 
          success: false, 
          message: `IFSC Code "${cleanIfsc}" was not found in the Indian banking directory. Please check the code or enter bank details manually.` 
        };
      }
      return { 
        success: false, 
        message: `Banking directory lookup failed (HTTP ${response.status}). Please enter bank details manually.` 
      };
    }

    const resData = await response.json();

    const formattedData = {
      ifsc: resData.IFSC || cleanIfsc,
      bankName: resData.BANK || '',
      bankCode: resData.BANKCODE || cleanIfsc.substring(0, 4),
      branch: resData.BRANCH || '',
      address: resData.ADDRESS || '',
      city: resData.CITY || resData.CENTRE || '',
      district: resData.DISTRICT || '',
      state: resData.STATE || '',
      contact: resData.CONTACT || '',
      micr: resData.MICR || '',
      upi: Boolean(resData.UPI),
      imps: Boolean(resData.IMPS),
      neft: Boolean(resData.NEFT),
      rtgs: Boolean(resData.RTGS),
    };

    // Cache the result
    ifscCache.set(cleanIfsc, formattedData);

    return {
      success: true,
      data: formattedData,
      fromCache: false
    };
  } catch (error) {
    console.warn('⚠️ IFSC lookup network exception:', error);
    
    // Check if we can identify bank from prefix
    const prefix = cleanIfsc.substring(0, 4);
    const matchedBank = INDIAN_BANKS_LIST.find(b => b.ifscPrefix === prefix || b.code === prefix);
    
    if (matchedBank) {
      return {
        success: true,
        data: {
          ifsc: cleanIfsc,
          bankName: matchedBank.name,
          bankCode: matchedBank.code,
          branch: '',
          city: '',
          district: '',
          state: '',
          upi: true,
          imps: true,
          neft: true,
          rtgs: true,
        },
        partial: true,
        message: `Offline match: Identified as ${matchedBank.name}. Please enter branch name manually.`
      };
    }

    return {
      success: false,
      message: 'Unable to connect to banking lookup service. Please check your internet connection or enter details manually.'
    };
  }
};

/**
 * Sanitize and validate Indian mobile phone numbers
 * Only allows numeric digits and restricts length to 10 digits
 * @param {string} value 
 * @returns {string} Clean numeric string (max 10 digits)
 */
export const sanitizeMobileNumber = (value) => {
  if (!value) return '';
  return String(value).replace(/\D/g, '').slice(0, 10);
};

/**
 * Validate 10-digit Indian Mobile Number (starting with 6, 7, 8, or 9)
 * @param {string} mobile 
 * @returns {boolean}
 */
export const isValidIndianMobile = (mobile) => {
  if (!mobile) return false;
  const clean = sanitizeMobileNumber(mobile);
  return /^[6-9]\d{9}$/.test(clean);
};

/**
 * Sanitize Account Numbers (strictly numeric, max 18 digits)
 * @param {string} value 
 * @returns {string}
 */
export const sanitizeAccountNumber = (value) => {
  if (!value) return '';
  return String(value).replace(/\D/g, '').slice(0, 18);
};
