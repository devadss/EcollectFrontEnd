import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { merchantApi } from '../services/api';

const MerchantContext = createContext(null);

export const MerchantProvider = ({ children }) => {
  const [merchants, setMerchants] = useState([]);
  const [loadingMerchants, setLoadingMerchants] = useState(false);
  const [error, setError] = useState(null);

  // Read role and user info from storage
  const authUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('auth_user') || localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  })();

  const rawRole = (localStorage.getItem('userRole') || localStorage.getItem('user_role') || localStorage.getItem('role') || authUser?.role || '').toLowerCase().trim();
  const normRole = rawRole.replace(/[^a-z0-9]/g, '');

  const isMerchantUser = normRole.includes('merchant');
  const isBranchUser = normRole.includes('branch') && !normRole.includes('merchant');
  const isAgentUser = normRole.includes('agent') && !normRole.includes('merchant') && !normRole.includes('software');

  // SoftwareAdmin is ONLY true if it explicitly contains 'software' or 'superadmin', and NOT 'merchant', 'branch', or 'agent'
  const isSoftwareAdmin = (normRole.includes('software') || normRole.includes('superadmin') || normRole === 'admin') && !normRole.includes('merchant') && !normRole.includes('branch') && !normRole.includes('agent');

  const merchantSelfId = authUser?.merchantId || authUser?.MerchantId || (isMerchantUser ? (authUser?.merchantId || authUser?.MerchantId || authUser?.id) : null);

  // Selected merchant ID for admin scoping ('ALL' or numeric ID string)
  const [selectedMerchantId, setSelectedMerchantIdState] = useState(() => {
    if (!isSoftwareAdmin && merchantSelfId) {
      return String(merchantSelfId);
    }
    const saved = localStorage.getItem('admin_selected_merchant_id');
    return saved !== null && saved !== undefined ? saved : 'ALL';
  });

  // Setter with persistence
  const setSelectedMerchantId = useCallback((id) => {
    if (!isSoftwareAdmin) return; // Non-admin cannot switch merchants
    const cleanId = id === null || id === undefined || id === '' ? 'ALL' : String(id);
    setSelectedMerchantIdState(cleanId);
    try {
      localStorage.setItem('admin_selected_merchant_id', cleanId);
    } catch (e) {
      console.warn('Failed to save selected merchant to localStorage', e);
    }
  }, [isSoftwareAdmin]);

  // Fetch list of merchants
  const refreshMerchants = useCallback(async () => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) return;

    try {
      setLoadingMerchants(true);
      setError(null);

      if (isSoftwareAdmin) {
        // Software admin fetches all merchants
        const res = await merchantApi.getAll();
        const listData = res?.data?.data || res?.data || [];
        const safeList = Array.isArray(listData) ? listData : [];
        setMerchants(safeList);
      } else if (merchantSelfId) {
        // Merchant user only fetches their own merchant record
        try {
          const res = await merchantApi.getById(merchantSelfId);
          const singleM = res?.data?.data || res?.data;
          if (singleM) {
            setMerchants([singleM]);
          }
        } catch {
          setMerchants([]);
        }
      }
    } catch (err) {
      console.error('MerchantContext: Error fetching merchants list:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to load merchants');
    } finally {
      setLoadingMerchants(false);
    }
  }, [isSoftwareAdmin, merchantSelfId]);

  // Initial load
  useEffect(() => {
    refreshMerchants();
  }, [refreshMerchants]);

  // Resolved selected merchant object
  const selectedMerchant = useMemo(() => {
    if (!selectedMerchantId || selectedMerchantId === 'ALL') return null;
    return merchants.find(m => String(m.id) === String(selectedMerchantId) || String(m.merchantId) === String(selectedMerchantId)) || null;
  }, [merchants, selectedMerchantId]);

  const value = useMemo(() => ({
    merchants,
    loadingMerchants,
    error,
    selectedMerchantId,
    selectedMerchant,
    setSelectedMerchantId,
    refreshMerchants,
    isSoftwareAdmin,
  }), [merchants, loadingMerchants, error, selectedMerchantId, selectedMerchant, setSelectedMerchantId, refreshMerchants, isSoftwareAdmin]);

  return (
    <MerchantContext.Provider value={value}>
      {children}
    </MerchantContext.Provider>
  );
};

export const useMerchantContext = () => {
  const context = useContext(MerchantContext);
  if (!context) {
    // Fallback safe dummy context if rendered outside provider
    return {
      merchants: [],
      loadingMerchants: false,
      error: null,
      selectedMerchantId: 'ALL',
      selectedMerchant: null,
      setSelectedMerchantId: () => {},
      refreshMerchants: () => {},
      isSoftwareAdmin: true,
    };
  }
  return context;
};

export default MerchantContext;
