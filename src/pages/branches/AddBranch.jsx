import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout'; 
import { branchApi, merchantApi } from '../../services/api';  
import StateDistrictSelect from '../../components/common/StateDistrictSelect';
import { lookupLocationByPincode } from '../../services/locationService';
import { useDialog } from '../../context/DialogContext';
import './AddBranch.css';

// Ultra-crisp SVG Icons for AddBranch
const Icons = {
  Building: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="21" x2="21" y2="21" />
      <line x1="6" y1="18" x2="6" y2="11" />
      <line x1="10" y1="18" x2="10" y2="11" />
      <line x1="14" y1="18" x2="14" y2="11" />
      <line x1="18" y1="18" x2="18" y2="11" />
      <polygon points="12 2 2 7 22 7 12 2" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  Shield: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Key: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21 2-2 2m-1.5 1.5L14 9a5 5 0 1 0 2.8 2.8l2.2-2.2m-1.5-1.5L20 6m-2-2 2-2"/>
      <circle cx="7.5" cy="15.5" r="2.5"/>
    </svg>
  ),
  Eye: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  EyeOff: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
      <line x1="2" y1="2" x2="22" y2="22"/>
    </svg>
  ),
  Zap: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  MapPin: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Phone: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  Mail: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  FileText: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  Sparkles: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z"/>
    </svg>
  ),
  RotateCcw: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  ),
  Link: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  AlertTriangle: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  CheckCircle: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
};

const AddBranch = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { showSuccess, showError, showWarning } = useDialog();
  const [loading, setLoading] = useState(false);
  const [fetchingBranches, setFetchingBranches] = useState(false);
  const [branchOptions, setBranchOptions] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [integrationStatus, setIntegrationStatus] = useState('No');
  const [resolvingPin, setResolvingPin] = useState(false);

  // Password state controls
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Guard refs to prevent duplicate/concurrent API requests
  const isFetchingRef = useRef(false);
  const fetchedMerchantIdRef = useRef(null);

  const authUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('auth_user') || localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  })();

  const rawRole = (localStorage.getItem('user_role') || localStorage.getItem('role') || authUser?.role || '').toLowerCase().trim();
  const normRole = rawRole.replace(/[^a-z0-9]/g, '');
  const isMerchantUser = normRole.includes('merchant');
  const isSoftwareAdmin = (normRole.includes('software') || normRole.includes('superadmin') || normRole === 'admin') && !normRole.includes('merchant') && !normRole.includes('branch') && !normRole.includes('agent');

  const currentMerchantId = authUser?.merchantId || authUser?.MerchantId || localStorage.getItem('merchantId') || (isMerchantUser ? (authUser?.merchantId || authUser?.MerchantId || authUser?.id) : null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    merchantId: currentMerchantId ? String(currentMerchantId) : '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    isActive: true,
    description: '',
    external_branch_id: '',
    source_system: 'EXTERNAL',
  });

  const [errors, setErrors] = useState({});

  // Single-flight fetch external branch list with deduplication
  const fetchBranchList = useCallback(async (mid = null, force = false) => {
    if (isFetchingRef.current) {
      return;
    }

    const targetMid = mid !== null ? String(mid) : (formData.merchantId ? String(formData.merchantId) : '');
    if (!force && fetchedMerchantIdRef.current === targetMid && branchOptions.length > 0) {
      return;
    }

    try {
      isFetchingRef.current = true;
      setFetchingBranches(true);
      
      const res = await branchApi.fetchBranchList(targetMid ? { merchantId: targetMid } : undefined);
      let branches = [];
      
      if (res?.data?.data && Array.isArray(res.data.data)) {
        branches = res.data.data;
      } else if (res?.data && Array.isArray(res.data)) {
        branches = res.data;
      }
      
      if (branches && branches.length > 0) {
        const mappedBranches = branches.map(b => ({
          Branch_Code: b.branch_Code || b.Branch_Code || b.code || '',
          Branch_Name: b.branch_Name || b.Branch_Name || b.name || '',
          Address: b.address || b.Address || '',
        }));
        setBranchOptions(mappedBranches);
        fetchedMerchantIdRef.current = targetMid;
      } else {
        setBranchOptions([]);
        fetchedMerchantIdRef.current = targetMid;
      }
    } catch (error) {
      console.error('Error fetching branch list:', error);
      setBranchOptions([]);
    } finally {
      isFetchingRef.current = false;
      setFetchingBranches(false);
    }
  }, [formData.merchantId, branchOptions.length]);

  // Initial page initialization
  useEffect(() => {
    let isMounted = true;

    const initPage = async () => {
      const params = new URLSearchParams(window.location.search);
      const qMid = params.get('merchantId') || currentMerchantId;
      const initialMid = qMid ? String(qMid) : '';

      if (initialMid) {
        setFormData(prev => ({ ...prev, merchantId: initialMid }));
      }

      if (isEdit && !isSoftwareAdmin) {
        showWarning('Modification of Branch records is restricted to the Software Admin portal.', 'Access Restricted');
        navigate('/branches');
        return;
      }

      try {
        // 1. Load merchants
        let safeList = [];
        try {
          const mRes = await merchantApi.getAll();
          const mList = mRes?.data?.data || mRes?.data || [];
          safeList = Array.isArray(mList) ? mList : [];
        } catch (e) {
          console.warn('Could not load all merchants list:', e);
        }

        // If pre-selected merchant ID exists (merchant login or query param)
        const targetMid = initialMid;
        let selectedMerchant = safeList.find(m => String(m.id) === String(targetMid));

        // Fallback: If not in safeList, fetch single merchant directly
        if (!selectedMerchant && targetMid) {
          try {
            const singleMRes = await merchantApi.getById(targetMid);
            const singleM = singleMRes?.data?.data || singleMRes?.data;
            if (singleM && (singleM.id || singleM.merchantName)) {
              selectedMerchant = singleM;
              safeList = [singleM, ...safeList.filter(m => String(m.id) !== String(targetMid))];
            }
          } catch (e) {
            console.warn('Could not load single merchant details:', e);
          }
        }

        if (isMounted) setMerchants(safeList);

        // 2. If editing, load branch details
        if (isEdit) {
          const bRes = await branchApi.getById(id);
          const bData = bRes?.data?.data || bRes?.data || {};
          if (isMounted) {
            setFormData(prev => ({
              ...prev,
              ...bData,
              password: '',
              confirmPassword: '',
              merchantId: bData.merchantId ? String(bData.merchantId) : prev.merchantId
            }));

            const finalMid = bData.merchantId || targetMid;
            let mObj = safeList.find(m => String(m.id) === String(finalMid)) || selectedMerchant;
            if (mObj) {
              const status = mObj.integrationStatus || mObj.IntegrationStatus || 'No';
              setIntegrationStatus(status);
            }
          }
        } else if (targetMid && isMounted) {
          // 3. New branch with pre-selected merchant
          if (selectedMerchant) {
            const status = selectedMerchant.integrationStatus || selectedMerchant.IntegrationStatus || 'No';
            setIntegrationStatus(status);
            const isLive = String(status).toUpperCase() === 'Y' || String(status).toUpperCase() === 'YES' || status === true;
            if (isLive) {
              fetchBranchList(targetMid, true);
            }
          }
        }
      } catch (err) {
        console.warn('Initialization error in AddBranch:', err);
      }
    };

    initPage();

    return () => {
      isMounted = false;
    };
  }, [id, isEdit, isSoftwareAdmin, navigate, currentMerchantId, fetchBranchList, showWarning]);

  // Handle Merchant Selection & Sync Integration Mode Dynamically
  const handleMerchantChange = (e) => {
    const selectedMid = e.target.value;
    
    const selectedMerchant = merchants.find(m => String(m.id) === String(selectedMid));
    const mStatus = selectedMerchant ? (selectedMerchant.integrationStatus || selectedMerchant.IntegrationStatus || 'No') : 'No';
    
    setFormData(prev => ({
      ...prev,
      merchantId: selectedMid,
      name: '',
      code: '',
      external_branch_id: '',
      address: ''
    }));

    if (errors.merchantId) {
      setErrors(prev => ({ ...prev, merchantId: null }));
    }

    setIntegrationStatus(mStatus);

    if ((mStatus === 'Y' || mStatus === 'Yes') && !isEdit) {
      fetchBranchList(selectedMid, true);
    } else {
      setBranchOptions([]);
      fetchedMerchantIdRef.current = null;
    }
  };

  // Handle Branch Selection from External Dropdown
  const handleBranchSelect = (e) => {
    const selectedBranchCode = e.target.value;
    const selectedBranch = branchOptions.find(b => b.Branch_Code === selectedBranchCode);
    
    if (selectedBranch) {
      setFormData(prev => ({
        ...prev,
        code: selectedBranch.Branch_Code || '',
        external_branch_id: selectedBranch.Branch_Code || '',
        name: selectedBranch.Branch_Name || '',
        address: selectedBranch.Address || prev.address || '',
        source_system: 'EXTERNAL'
      }));
      if (errors.name) setErrors(prev => ({ ...prev, name: null }));
      if (errors.code) setErrors(prev => ({ ...prev, code: null }));
    }
  };

  // Password Generator Helper
  const handleGeneratePassword = () => {
    const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowercase = "abcdefghijkmnpqrstuvwxyz";
    const numbers = "23456789";
    const symbols = "!@#$%^&*";
    
    let pwd = "";
    pwd += uppercase[Math.floor(Math.random() * uppercase.length)];
    pwd += lowercase[Math.floor(Math.random() * lowercase.length)];
    pwd += numbers[Math.floor(Math.random() * numbers.length)];
    pwd += symbols[Math.floor(Math.random() * symbols.length)];
    
    const allChars = uppercase + lowercase + numbers + symbols;
    for (let i = 0; i < 6; i++) {
      pwd += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    const shuffled = pwd.split('').sort(() => 0.5 - Math.random()).join('');
    
    setFormData(prev => ({
      ...prev,
      password: shuffled,
      confirmPassword: shuffled
    }));
    setShowPassword(true);
    setShowConfirmPassword(true);
    
    if (errors.password) setErrors(prev => ({ ...prev, password: null }));
    if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: null }));
  };

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { text: '', score: 0, color: 'transparent' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { text: 'Weak', score: 33, color: '#ef4444' };
    if (score <= 4) return { text: 'Medium', score: 66, color: '#f59e0b' };
    return { text: 'Strong', score: 100, color: '#10b981' };
  };

  const handleChange = async (e) => {
    let { name, value, type, checked } = e.target;

    // Strict sanitization for mobile phone: numeric only, max 10 digits
    if (name === 'phone') {
      value = value.replace(/\D/g, '').slice(0, 10);
    }

    // Strict sanitization for zipCode / pincode: numeric only, max 6 digits
    if (name === 'zipCode') {
      value = value.replace(/\D/g, '').slice(0, 6);
    }

    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      if (name === 'code') {
        updated.external_branch_id = value;
      }
      return updated;
    });

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }

    // Auto-detect State and District when a 6-digit Pincode is entered
    if (name === 'zipCode' && value && value.trim().length === 6 && /^\d{6}$/.test(value.trim())) {
      try {
        setResolvingPin(true);
        const loc = await lookupLocationByPincode(value.trim());
        if (loc && loc.state) {
          setFormData(prev => ({
            ...prev,
            state: loc.state,
            city: loc.district || loc.city || prev.city
          }));
        }
      } catch (err) {
        console.warn('Pincode auto-lookup error in AddBranch:', err);
      } finally {
        setResolvingPin(false);
      }
    }
  };

  const validate = () => {
    let tempErrors = {};
    if (isSoftwareAdmin && !formData.merchantId) {
      tempErrors.merchantId = "Please select the respective merchant partner";
    }
    if (!formData.name?.trim()) tempErrors.name = "Branch Name is required";
    if (!formData.code?.trim()) tempErrors.code = "Branch Code is required";
    if (!formData.address?.trim()) tempErrors.address = "Operating Street Address is required";
    if (!formData.city?.trim()) tempErrors.city = "City / District is required";
    if (!formData.state?.trim()) tempErrors.state = "State jurisdiction is required";
    
    // Strict Zipcode validation (6 numeric digits)
    if (!formData.zipCode?.trim()) {
      tempErrors.zipCode = "Postal PIN code is required";
    } else if (formData.zipCode.trim().length !== 6 || !/^\d{6}$/.test(formData.zipCode.trim())) {
      tempErrors.zipCode = "PIN Code must be exactly 6 numeric digits";
    }

    if (!formData.country?.trim()) tempErrors.country = "Country is required";
    
    // Strict Phone Number validation (10 numeric digits starting with 6, 7, 8, or 9)
    if (!formData.phone?.trim()) {
      tempErrors.phone = "Official Phone Number is required";
    } else if (formData.phone.trim().length !== 10) {
      tempErrors.phone = "Phone number must be exactly 10 numeric digits";
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      tempErrors.phone = "Invalid Indian mobile number. Must start with 6, 7, 8, or 9";
    }

    // Strict Email validation
    if (!formData.email?.trim()) {
      tempErrors.email = "Official Branch Email is required";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email.trim())) {
      tempErrors.email = "Enter a valid email address (e.g. branch@partner.in)";
    }

    // Password Validation (Mandatory for Create, Optional for Edit)
    if (!isEdit) {
      if (!formData.password?.trim()) {
        tempErrors.password = "Branch login password is required";
      } else if (formData.password.length < 6) {
        tempErrors.password = "Password must be at least 6 characters long";
      }

      if (formData.password && formData.password !== formData.confirmPassword) {
        tempErrors.confirmPassword = "Passwords do not match";
      }
    } else {
      if (formData.password?.trim()) {
        if (formData.password.length < 6) {
          tempErrors.password = "Password must be at least 6 characters long";
        }
        if (formData.password !== formData.confirmPassword) {
          tempErrors.confirmPassword = "Passwords do not match";
        }
      }
    }

    if (!formData.description?.trim()) tempErrors.description = "Operational description is required";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!validate()) {
      setLoading(false);
      showWarning("Please complete all mandatory highlighted branch fields.", "Validation Warning");
      return;
    }

    const resolvedMid = formData.merchantId ? Number(formData.merchantId) : (currentMerchantId ? Number(currentMerchantId) : null);
    const branchCode = (formData.code || '').trim();

    const submitPayload = {
      ...formData,
      code: branchCode,
      merchantId: resolvedMid,
      external_branch_id: branchCode,
      source_system: 'EXTERNAL',
      isActive: isEdit ? (formData.isActive ?? true) : (isSoftwareAdmin ? true : false),
      isApproved: isEdit ? (formData.isApproved ?? true) : (isSoftwareAdmin ? true : false),
    };

    if (formData.password?.trim()) {
      submitPayload.password = formData.password.trim();
      submitPayload.Password = formData.password.trim();
    }
    delete submitPayload.confirmPassword;

    try {
      if (isEdit) {
        await branchApi.update(id, submitPayload);
        showSuccess("Branch operational parameters updated successfully.", "Branch Updated");
      } else {
        await branchApi.create(submitPayload);
        if (!isSoftwareAdmin) {
          showSuccess('Branch registered successfully! Submitted for Software Admin review & approval.', 'Branch Registered');
        } else {
          showSuccess('Enterprise Branch provisioned and registered successfully.', 'Branch Registered');
        }
      }
      navigate('/branches');
    } catch (error) {
      console.error('Error saving branch:', error);
      showError(error?.response?.data?.message || 'Failed to save branch. Please verify your entries.', 'Branch Save Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      code: '',
      merchantId: currentMerchantId ? String(currentMerchantId) : '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
      isActive: true,
      description: '',
      external_branch_id: '',
      source_system: 'EXTERNAL',
    });
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const isIntegrationActive = String(integrationStatus).toUpperCase() === 'Y' || String(integrationStatus).toUpperCase() === 'YES' || integrationStatus === true;
  const selectedMerchantObj = merchants.find(m => String(m.id) === String(formData.merchantId));
  const pwdStrength = getPasswordStrength(formData.password);

  return (
    <DashboardLayout role={rawRole}>
      <div className="add-branch-wrapper">
        
        {/* HERO HEADER */}
        <div className="add-branch-hero">
          <div className="add-branch-hero-left">
            <div className="add-branch-badge-tag">
              <span className="pulse-dot"></span>
              <span>{isEdit ? 'BRANCH CONFIGURATION' : 'ENTERPRISE BRANCH ONBOARDING'}</span>
            </div>
            <div className="add-branch-title-stack">
              <h1 className="add-branch-main-title">
                {isEdit ? 'Edit Branch' : 'Add New'} <span className="gradient-text">Branch Location</span>
              </h1>
              <p className="add-branch-subtitle">
                {isEdit 
                  ? 'Update operational coordinates, access credentials, and jurisdiction parameters.'
                  : 'Register and provision an enterprise branch unit with customized authentication credentials.'
                }
              </p>
            </div>
          </div>

          <div className="add-branch-hero-actions">
            <button 
              type="button" 
              className="add-branch-back-btn" 
              onClick={() => navigate('/branches')}
            >
              <Icons.ArrowLeft />
              <span>Back to Branches</span>
            </button>
          </div>
        </div>

        {/* MERCHANT PORTAL APPROVAL NOTICE */}
        {!isSoftwareAdmin && (
          <div className="add-branch-notice-card">
            <div className="notice-icon-box">
              <Icons.Shield />
            </div>
            <div className="notice-content">
              <strong className="notice-title">
                Software Admin Approval Required
              </strong>
              <span className="notice-desc">
                Branches created via Merchant Portal will be submitted in <strong>Pending Review</strong> status and automatically activated once approved by Software Admin.
              </span>
            </div>
          </div>
        )}

        {/* MAIN FORM FLOW */}
        <form onSubmit={handleSubmit} className="branch-form-flow" noValidate>
          
          {/* STEP 1: MERCHANT SELECTION */}
          <div className="form-step-card is-accent">
            <div className="step-card-header">
              <div className="step-header-left">
                <div className="step-number-badge">01</div>
                <div className="step-titles">
                  <h3 className="step-title-text">
                    Merchant Partner Association <span className="req-star">*</span>
                  </h3>
                  <p className="step-desc-text">
                    Select or verify the merchant partner entity governing this branch location
                  </p>
                </div>
              </div>

              {formData.merchantId && (
                <span className={`step-status-tag ${isIntegrationActive ? 'is-live' : 'is-standard'}`}>
                  {isIntegrationActive ? '⚡ Dynamic CBS API (Y)' : '📝 Standard Mode (N)'}
                </span>
              )}
            </div>

            <div className="form-grid">
              {isSoftwareAdmin ? (
                <div className="form-group full-width">
                  <label>
                    <span>Assign to Merchant Partner <span className="req-star">*</span></span>
                    {formData.merchantId && <span className="label-hint-badge">Selected: #{formData.merchantId}</span>}
                  </label>
                  <select
                    name="merchantId"
                    value={formData.merchantId || ''}
                    onChange={handleMerchantChange}
                    className={`branch-select-dropdown ${errors.merchantId ? 'input-error' : ''}`}
                    disabled={isEdit}
                  >
                    <option value="">-- Choose Merchant Partner to Load Profile & Integration --</option>
                    {merchants.map((m) => {
                      const isLive = m.integrationStatus === 'Y' || m.IntegrationStatus === 'Y';
                      return (
                        <option key={m.id} value={m.id}>
                          {m.merchantName} ({m.registeredEmail || `ID: #${m.id}`}) — {isLive ? '[Dynamic API (Y)]' : '[Standard (N)]'}
                        </option>
                      );
                    })}
                  </select>
                  {errors.merchantId && (
                    <span className="error-text">
                      <Icons.AlertTriangle /> {errors.merchantId}
                    </span>
                  )}
                </div>
              ) : (
                <div className="form-group full-width">
                  <label>
                    <span>Merchant Partner</span>
                    <span className="label-hint-badge">Authenticated Profile</span>
                  </label>
                  <input
                    type="text"
                    value={selectedMerchantObj?.merchantName || `Merchant #${formData.merchantId}`}
                    disabled
                  />
                </div>
              )}
            </div>
          </div>

          {/* STEP 2: INTEGRATION STATUS BANNER */}
          <div className={`integration-status-banner ${isIntegrationActive ? 'is-active' : 'is-inactive'}`}>
            <div className="integration-banner-content">
              <div className="integration-banner-icon">
                {isIntegrationActive ? <Icons.Link /> : <Icons.FileText />}
              </div>
              <div className="integration-banner-text-block">
                <div className="integration-banner-title">
                  {isIntegrationActive ? 'Dynamic Core Banking (CBS) Integration Active' : 'Standard Manual Provisioning Mode'}
                </div>
                <div className="integration-banner-desc">
                  {!formData.merchantId ? (
                    'Please select a merchant partner above to determine API integration mode and load branch specifications.'
                  ) : isIntegrationActive ? (
                    `Direct CBS API connection established for ${selectedMerchantObj?.merchantName || 'Merchant'}. Branches are automatically fetched from the external system.`
                  ) : (
                    `Manual registration active for ${selectedMerchantObj?.merchantName || 'Merchant'}. Please enter Branch Name and Branch Code manually.`
                  )}
                </div>
              </div>
            </div>

            <div className="integration-banner-badge-group">
              {fetchingBranches && (
                <div className="integration-loader-pill">
                  <span className="branch-spinner-small"></span>
                  <span>Syncing CBS API...</span>
                </div>
              )}
              <span className={`integration-badge-pill ${isIntegrationActive ? 'is-active' : 'is-inactive'}`}>
                {isIntegrationActive ? '✅ Live CBS API (Y)' : '📝 Standard Mode (N)'}
              </span>
            </div>
          </div>

          {/* STEP 3: BRANCH DETAILS & LOCATION */}
          <div className="form-step-card">
            <div className="step-card-header">
              <div className="step-header-left">
                <div className="step-number-badge">02</div>
                <div className="step-titles">
                  <h3 className="step-title-text">
                    Branch Specifications & Location <span className="req-star">*</span>
                  </h3>
                  <p className="step-desc-text">
                    Specify official identity, internal code, and geographical jurisdictional address
                  </p>
                </div>
              </div>
            </div>

            <div className="form-grid">
              {/* Branch Name Input / Dropdown */}
              <div className="form-group">
                <label>
                  <span>Branch Name <span className="req-star">*</span></span>
                  {isIntegrationActive && !isEdit && <span className="label-hint-badge">External CBS List</span>}
                </label>
                
                {isIntegrationActive && !isEdit ? (
                  <>
                    {fetchingBranches ? (
                      <div className="loading-branch-box">
                        <span className="branch-spinner-small"></span> 
                        <span>Loading branches from CBS API...</span>
                      </div>
                    ) : branchOptions.length > 0 ? (
                      <select
                        value={formData.code}
                        onChange={handleBranchSelect}
                        className={`branch-select-dropdown ${errors.name ? 'input-error' : ''}`}
                      >
                        <option value="">-- Select Branch from External CBS --</option>
                        {branchOptions.map((branch, index) => (
                          <option key={index} value={branch.Branch_Code}>
                            {branch.Branch_Name} ({branch.Branch_Code})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="no-branches-warning-card">
                        <Icons.AlertTriangle />
                        <span>No branches returned by the external API. You can enter branch details manually below.</span>
                      </div>
                    )}
                  </>
                ) : (
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    placeholder="e.g. Bandra Financial Center"
                    disabled={isEdit}
                    className={errors.name ? 'input-error' : ''}
                  />
                )}
                {errors.name && (
                  <span className="error-text">
                    <Icons.AlertTriangle /> {errors.name}
                  </span>
                )}
              </div>

              {/* Branch Code Input / Auto-filled */}
              <div className="form-group">
                <label>
                  <span>Branch Code <span className="req-star">*</span></span>
                  <span className="label-hint-badge">Alpha-Numeric</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code || ''}
                  onChange={handleChange}
                  placeholder={fetchingBranches ? "Fetching code..." : "e.g. BR-1049"}
                  readOnly={isIntegrationActive && !isEdit && branchOptions.length > 0 && !!formData.code}
                  disabled={isEdit}
                  className={`font-mono ${errors.code ? 'input-error' : ''}`}
                />
                {errors.code && (
                  <span className="error-text">
                    <Icons.AlertTriangle /> {errors.code}
                  </span>
                )}
              </div>

              {/* Operating Street Address */}
              <div className="form-group full-width">
                <label>
                  <span>Operating Street Address <span className="req-star">*</span></span>
                  <span className="label-hint-badge">Physical Office</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  placeholder="e.g. Suite 402, Trade Square, MG Road"
                  className={errors.address ? 'input-error' : ''}
                />
                {errors.address && (
                  <span className="error-text">
                    <Icons.AlertTriangle /> {errors.address}
                  </span>
                )}
              </div>

              {/* State & District Combo Select */}
              <StateDistrictSelect
                stateValue={formData.state}
                districtValue={formData.city}
                onStateChange={handleChange}
                onDistrictChange={handleChange}
                stateName="state"
                districtName="city"
                stateLabel="State Jurisdiction *"
                districtLabel="District / City *"
                stateError={errors.state}
                districtError={errors.city}
                disabled={isEdit}
              />

              {/* Zip Code with Pincode auto-resolution */}
              <div className="form-group">
                <label>
                  <span>Postal PIN Code <span className="req-star">*</span></span>
                  <span className="label-hint-badge">
                    {resolvingPin ? 'Detecting State...' : 'Auto-detects Location'}
                  </span>
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode || ''}
                  onChange={handleChange}
                  placeholder="e.g. 400051"
                  maxLength={6}
                  className={`font-mono ${errors.zipCode ? 'input-error' : ''}`}
                />
                {errors.zipCode && (
                  <span className="error-text">
                    <Icons.AlertTriangle /> {errors.zipCode}
                  </span>
                )}
              </div>

              {/* Country */}
              <div className="form-group">
                <label>
                  <span>Country <span className="req-star">*</span></span>
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country || 'India'}
                  onChange={handleChange}
                  placeholder="e.g. India"
                  className={errors.country ? 'input-error' : ''}
                />
                {errors.country && (
                  <span className="error-text">
                    <Icons.AlertTriangle /> {errors.country}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* STEP 4: BRANCH ACCESS CREDENTIALS (PASSWORD CONFIGURATION) */}
          <div className="form-step-card">
            <div className="step-card-header">
              <div className="step-header-left">
                <div className="step-number-badge">03</div>
                <div className="step-titles">
                  <h3 className="step-title-text">
                    Branch Access Credentials {!isEdit && <span className="req-star">*</span>}
                  </h3>
                  <p className="step-desc-text">
                    {isEdit 
                      ? 'Update branch login password or leave empty to maintain current credentials'
                      : 'Set custom branch password or generate a cryptographically strong login key'
                    }
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="btn-generate-password"
                onClick={handleGeneratePassword}
                title="Generate and autofill a strong secure password"
              >
                <Icons.Zap />
                <span>Auto-Generate Password</span>
              </button>
            </div>

            <div className="form-grid">
              {/* Branch Password Field */}
              <div className="form-group">
                <label>
                  <span>
                    {isEdit ? 'New Password (Optional)' : 'Branch Password'} {!isEdit && <span className="req-star">*</span>}
                  </span>
                  {formData.password && (
                    <span 
                      className="label-hint-badge" 
                      style={{ color: pwdStrength.color, background: `${pwdStrength.color}22` }}
                    >
                      {pwdStrength.text}
                    </span>
                  )}
                </label>

                <div className="input-with-action">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password || ''}
                    onChange={handleChange}
                    placeholder={isEdit ? 'Leave blank to keep existing password' : 'Enter branch login password'}
                    autoComplete="new-password"
                    className={`font-mono ${errors.password ? 'input-error' : ''}`}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                  </button>
                </div>

                {formData.password && (
                  <div className="password-strength-wrap">
                    <div className="password-strength-meter">
                      <div 
                        className="password-strength-fill" 
                        style={{ width: `${pwdStrength.score}%`, backgroundColor: pwdStrength.color }}
                      ></div>
                    </div>
                    <span className="password-strength-text" style={{ color: pwdStrength.color }}>
                      {pwdStrength.text}
                    </span>
                  </div>
                )}

                {errors.password && (
                  <span className="error-text">
                    <Icons.AlertTriangle /> {errors.password}
                  </span>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="form-group">
                <label>
                  <span>
                    Confirm Password {!isEdit && <span className="req-star">*</span>}
                  </span>
                  {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <span className="label-hint-badge" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.15)' }}>
                      <Icons.CheckCircle /> Matches
                    </span>
                  )}
                </label>

                <div className="input-with-action">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword || ''}
                    onChange={handleChange}
                    placeholder="Re-enter password to confirm"
                    autoComplete="new-password"
                    className={`font-mono ${errors.confirmPassword ? 'input-error' : ''}`}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex="-1"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                  </button>
                </div>

                {errors.confirmPassword && (
                  <span className="error-text">
                    <Icons.AlertTriangle /> {errors.confirmPassword}
                  </span>
                )}
              </div>

              <div className="password-helper-card">
                <Icons.Key />
                <span>
                  Branch users will use this password alongside their registered email or branch code to access their branch portal terminal.
                </span>
              </div>
            </div>
          </div>

          {/* STEP 5: CONTACT DETAILS */}
          <div className="form-step-card">
            <div className="step-card-header">
              <div className="step-header-left">
                <div className="step-number-badge">04</div>
                <div className="step-titles">
                  <h3 className="step-title-text">
                    Official Communications <span className="req-star">*</span>
                  </h3>
                  <p className="step-desc-text">
                    Direct branch contact channels for operational alerts, escalations, and receipts
                  </p>
                </div>
              </div>
            </div>

            <div className="form-grid">
              {/* Phone Number */}
              <div className="form-group">
                <label>
                  <span>Official Phone Number <span className="req-star">*</span></span>
                  <span className="label-hint-badge">10 Digits</span>
                </label>
                <div className="input-with-prefix">
                  <span className="input-prefix-box">+91</span>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    placeholder="9876543210"
                    maxLength={10}
                    className={`font-mono ${errors.phone ? 'input-error' : ''}`}
                  />
                </div>
                {errors.phone && (
                  <span className="error-text">
                    <Icons.AlertTriangle /> {errors.phone}
                  </span>
                )}
              </div>

              {/* Official Branch Email */}
              <div className="form-group">
                <label>
                  <span>Official Branch Email <span className="req-star">*</span></span>
                  <span className="label-hint-badge">Alerts & Receipts</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  placeholder="branch.ops@merchantpartner.com"
                  className={errors.email ? 'input-error' : ''}
                />
                {errors.email && (
                  <span className="error-text">
                    <Icons.AlertTriangle /> {errors.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* STEP 6: OPERATIONAL SCOPE */}
          <div className="form-step-card">
            <div className="step-card-header">
              <div className="step-header-left">
                <div className="step-number-badge">05</div>
                <div className="step-titles">
                  <h3 className="step-title-text">
                    Operational Scope & Notes <span className="req-star">*</span>
                  </h3>
                  <p className="step-desc-text">
                    Operating jurisdiction coverage, terminal allocations, or special servicing notes
                  </p>
                </div>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group full-width">
                <label>
                  <span>Description & Branch Notes <span className="req-star">*</span></span>
                </label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Enter branch operational coverage, operating hours, designated agent supervisors, or special instructions..."
                  className={errors.description ? 'input-error' : ''}
                />
                {errors.description && (
                  <span className="error-text">
                    <Icons.AlertTriangle /> {errors.description}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* FORM ACTIONS FOOTER */}
          <div className="form-actions-footer">
            <div className="footer-meta-info">
              <Icons.Shield />
              <span>All changes are logged in the tamper-evident enterprise audit trial.</span>
            </div>

            <div className="footer-btn-group">
              <button 
                type="button" 
                className="btn-secondary-action" 
                onClick={() => navigate('/branches')}
                disabled={loading}
              >
                Cancel
              </button>

              {!isEdit && (
                <button 
                  type="button" 
                  className="btn-secondary-action" 
                  onClick={handleReset}
                  disabled={loading}
                  title="Reset form values"
                >
                  <Icons.RotateCcw />
                  <span>Reset</span>
                </button>
              )}

              <button 
                type="submit" 
                className="btn-primary-gradient btn-submit-branch" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="branch-spinner-small" style={{ borderTopColor: '#ffffff' }}></span>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Icons.Sparkles />
                    <span>{isEdit ? 'Update Branch Details' : 'Create Branch Location'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default AddBranch;