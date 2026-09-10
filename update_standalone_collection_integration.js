const fs = require('fs');
const babel = require('@babel/parser');

const accountsPath = 'e:\\FINWIN\\SOLUTIONS\\SOLUTIONS\\SOLUTION\\ECOLLECT-FRONTEND\\EcollectFrontEnd\\src\\pages\\accounts\\Accounts.jsx';
let code = fs.readFileSync(accountsPath, 'utf8');

// 1. Add import for standaloneCollectionService
if (!code.includes('standaloneCollectionService')) {
  code = code.replace(
    "import { playPaymentSuccessNotification } from '../../utils/audioAlert';",
    "import { playPaymentSuccessNotification } from '../../utils/audioAlert';\nimport { buildStandalonePaymentPayload, processStandaloneCashCollection } from '../../services/standaloneCollectionService';"
  );
}

// 2. Update handleGenerateDynamicQr to cleanly branch for isNonIntegrated
const oldQrPayload = `    const payload = {
      MerchantId: currentMerchantId,
      merchantId: currentMerchantId,
      Amount: finalAmount,
      amount: finalAmount,
      CollectionType: cleanColType,
      collectionType: cleanColType,
      QrSource: 'WEB',
      qrSource: 'WEB',
      qr_source: 'WEB',
      Source: 'COLLECTION',
      source: 'COLLECTION',
      PaymentMode: 'UPI',
      paymentMode: 'UPI',
      PaymentChannel: 'UPI',
      paymentChannel: 'UPI',
      note: qrNote || \`\${cleanColType} Deposit for \${qrAccount.accountHolder} - Acc #\${qrAccount.accountNumber}\`,
      Note: qrNote || \`\${cleanColType} Deposit for \${qrAccount.accountHolder} - Acc #\${qrAccount.accountNumber}\`,
      Description: qrNote || \`\${cleanColType} Deposit for \${qrAccount.accountHolder} - Acc #\${qrAccount.accountNumber}\`,
      agent_details: {
        agent_name: agentNameStr,
        agent_id: agentCodeStr,
        agent_orginId: agentCodeStr,
        agent_phone: agentPhoneStr,
        agent_email: agentEmailStr,
        agent_branch: branchNumericId
      },
      AgentDetails: {
        agent_name: agentNameStr,
        agent_id: agentCodeStr,
        agent_orginId: agentCodeStr,
        agent_phone: agentPhoneStr,
        agent_email: agentEmailStr,
        agent_branch: branchNumericId
      },
      customer_details: {
        customer_name: qrAccount.accountHolder || 'Customer',
        customer_phone: customerPhoneInput || qrAccount.phone || qrAccount.mobile || '9999999999',
        customer_accno: String(qrAccount.accountNumber || qrAccount.accountCode || ''),
        customer_id: String(qrAccount.customerId || qrAccount.id || '0'),
        customer_email: customerEmailInput || qrAccount.email || 'customer@finwin.com'
      },
      CustomerDetails: {
        customer_name: qrAccount.accountHolder || 'Customer',
        customer_phone: customerPhoneInput || qrAccount.phone || qrAccount.mobile || '9999999999',
        customer_accno: String(qrAccount.accountNumber || qrAccount.accountCode || ''),
        customer_id: String(qrAccount.customerId || qrAccount.id || '0'),
        customer_email: customerEmailInput || qrAccount.email || 'customer@finwin.com'
      }
    };`;

const newQrPayload = `    const payload = isNonIntegrated
      ? buildStandalonePaymentPayload({
          account: qrAccount,
          amount: finalAmount,
          mode: 'UPI',
          note: qrNote,
          user: authUser,
          agent: matchedAgent,
          branch: matchedBranch,
          customerPhone: customerPhoneInput,
          customerEmail: customerEmailInput
        })
      : {
          MerchantId: currentMerchantId,
          merchantId: currentMerchantId,
          Amount: finalAmount,
          amount: finalAmount,
          CollectionType: cleanColType,
          collectionType: cleanColType,
          QrSource: 'WEB',
          qrSource: 'WEB',
          qr_source: 'WEB',
          Source: 'COLLECTION',
          source: 'COLLECTION',
          PaymentMode: 'UPI',
          paymentMode: 'UPI',
          PaymentChannel: 'UPI',
          paymentChannel: 'UPI',
          note: qrNote || \`\${cleanColType} Deposit for \${qrAccount.accountHolder} - Acc #\${qrAccount.accountNumber}\`,
          Note: qrNote || \`\${cleanColType} Deposit for \${qrAccount.accountHolder} - Acc #\${qrAccount.accountNumber}\`,
          Description: qrNote || \`\${cleanColType} Deposit for \${qrAccount.accountHolder} - Acc #\${qrAccount.accountNumber}\`,
          agent_details: {
            agent_name: agentNameStr,
            agent_id: agentCodeStr,
            agent_orginId: agentCodeStr,
            agent_phone: agentPhoneStr,
            agent_email: agentEmailStr,
            agent_branch: branchNumericId
          },
          AgentDetails: {
            agent_name: agentNameStr,
            agent_id: agentCodeStr,
            agent_orginId: agentCodeStr,
            agent_phone: agentPhoneStr,
            agent_email: agentEmailStr,
            agent_branch: branchNumericId
          },
          customer_details: {
            customer_name: qrAccount.accountHolder || 'Customer',
            customer_phone: customerPhoneInput || qrAccount.phone || qrAccount.mobile || '9999999999',
            customer_accno: String(qrAccount.accountNumber || qrAccount.accountCode || ''),
            customer_id: String(qrAccount.customerId || qrAccount.id || '0'),
            customer_email: customerEmailInput || qrAccount.email || 'customer@finwin.com'
          },
          CustomerDetails: {
            customer_name: qrAccount.accountHolder || 'Customer',
            customer_phone: customerPhoneInput || qrAccount.phone || qrAccount.mobile || '9999999999',
            customer_accno: String(qrAccount.accountNumber || qrAccount.accountCode || ''),
            customer_id: String(qrAccount.customerId || qrAccount.id || '0'),
            customer_email: customerEmailInput || qrAccount.email || 'customer@finwin.com'
          }
        };`;

if (code.includes(oldQrPayload)) {
  code = code.replace(oldQrPayload, newQrPayload);
}

// 3. Update handleGeneratePaymentLink to cleanly branch for isNonIntegrated
const oldLinkPayload = `    const payload = {
      MerchantId: currentMerchantId,
      merchantId: currentMerchantId,
      Amount: finalAmount,
      amount: finalAmount,
      CollectionType: cleanColType,
      collectionType: cleanColType,
      QrSource: 'WEB',
      qrSource: 'WEB',
      qr_source: 'WEB',
      Source: 'COLLECTION',
      source: 'COLLECTION',
      PaymentMode: 'LINK',
      paymentMode: 'LINK',
      PaymentChannel: 'LINK',
      paymentChannel: 'LINK',
      note: qrNote || \`\${cleanColType} payment link for \${qrAccount.accountHolder} - Acc #\${qrAccount.accountNumber}\`,
      Note: qrNote || \`\${cleanColType} payment link for \${qrAccount.accountHolder} - Acc #\${qrAccount.accountNumber}\`,
      Description: qrNote || \`\${cleanColType} payment link for \${qrAccount.accountHolder} - Acc #\${qrAccount.accountNumber}\`,
      agent_details: {
        agent_name: agentNameStr,
        agent_id: agentCodeStr,
        agent_orginId: agentCodeStr,
        agent_phone: agentPhoneStr,
        agent_email: agentEmailStr,
        agent_branch: branchNumericId
      },
      AgentDetails: {
        agent_name: agentNameStr,
        agent_id: agentCodeStr,
        agent_orginId: agentCodeStr,
        agent_phone: agentPhoneStr,
        agent_email: agentEmailStr,
        agent_branch: branchNumericId
      },
      customer_details: {
        customer_name: qrAccount.accountHolder || 'Customer',
        customer_phone: phoneNum,
        customer_accno: String(qrAccount.accountNumber || qrAccount.accountCode || ''),
        customer_id: String(qrAccount.customerId || qrAccount.id || '0'),
        customer_email: emailAddr
      },
      CustomerDetails: {
        customer_name: qrAccount.accountHolder || 'Customer',
        customer_phone: phoneNum,
        customer_accno: String(qrAccount.accountNumber || qrAccount.accountCode || ''),
        customer_id: String(qrAccount.customerId || qrAccount.id || '0'),
        customer_email: emailAddr
      }
    };`;

const newLinkPayload = `    const payload = isNonIntegrated
      ? buildStandalonePaymentPayload({
          account: qrAccount,
          amount: finalAmount,
          mode: 'LINK',
          note: qrNote,
          user: authUser,
          agent: matchedAgent,
          branch: matchedBranch,
          customerPhone: phoneNum,
          customerEmail: emailAddr
        })
      : {
          MerchantId: currentMerchantId,
          merchantId: currentMerchantId,
          Amount: finalAmount,
          amount: finalAmount,
          CollectionType: cleanColType,
          collectionType: cleanColType,
          QrSource: 'WEB',
          qrSource: 'WEB',
          qr_source: 'WEB',
          Source: 'COLLECTION',
          source: 'COLLECTION',
          PaymentMode: 'LINK',
          paymentMode: 'LINK',
          PaymentChannel: 'LINK',
          paymentChannel: 'LINK',
          note: qrNote || \`\${cleanColType} payment link for \${qrAccount.accountHolder} - Acc #\${qrAccount.accountNumber}\`,
          Note: qrNote || \`\${cleanColType} payment link for \${qrAccount.accountHolder} - Acc #\${qrAccount.accountNumber}\`,
          Description: qrNote || \`\${cleanColType} payment link for \${qrAccount.accountHolder} - Acc #\${qrAccount.accountNumber}\`,
          agent_details: {
            agent_name: agentNameStr,
            agent_id: agentCodeStr,
            agent_orginId: agentCodeStr,
            agent_phone: agentPhoneStr,
            agent_email: agentEmailStr,
            agent_branch: branchNumericId
          },
          AgentDetails: {
            agent_name: agentNameStr,
            agent_id: agentCodeStr,
            agent_orginId: agentCodeStr,
            agent_phone: agentPhoneStr,
            agent_email: agentEmailStr,
            agent_branch: branchNumericId
          },
          customer_details: {
            customer_name: qrAccount.accountHolder || 'Customer',
            customer_phone: phoneNum,
            customer_accno: String(qrAccount.accountNumber || qrAccount.accountCode || ''),
            customer_id: String(qrAccount.customerId || qrAccount.id || '0'),
            customer_email: emailAddr
          },
          CustomerDetails: {
            customer_name: qrAccount.accountHolder || 'Customer',
            customer_phone: phoneNum,
            customer_accno: String(qrAccount.accountNumber || qrAccount.accountCode || ''),
            customer_id: String(qrAccount.customerId || qrAccount.id || '0'),
            customer_email: emailAddr
          }
        };`;

if (code.includes(oldLinkPayload)) {
  code = code.replace(oldLinkPayload, newLinkPayload);
}

// 4. Update handleProcessCashCollection for standalone execution
const oldCashCall = `    setCashLoading(true);
    setCashError(null);
    try {
      console.log('📡 [Cash Collection Engine] Calling processCashCollection with payload:', payload);
      const res = await paymentApi.processCashCollection(payload);
      console.log('✅ [Cash Collection Engine] Response received:', res.data);

      const resData = res.data || {};
      const statusStr = (resData.status || resData.Status || '').toString().toUpperCase();
      const isSuccess = statusStr === 'Y' || statusStr === '1' || statusStr === 'SUCCESS' || resData.status === true;

      if (isSuccess) {
        const txnId = resData.transactionId || resData.TransactionId || resData.receipt?.TRAN_ID || \`CASH-\${Date.now().toString().slice(-6)}\`;
        setCashData({
          status: 'SUCCESS',
          amount: finalAmount,
          transactionId: txnId,
          message: resData.message || 'Cash collection successfully posted to CBS core banking system.',
          timestamp: new Date().toISOString(),
          customerName: qrAccount.accountHolder,
          accountNumber: qrAccount.accountNumber,
          collectionType: cleanColType,
          agentName: agentNameStr
        });

        // Optimistically update account balance in state
        setAccounts(prev => prev.map(a => {
          if (a.accountNumber === qrAccount.accountNumber) {
            const curBal = Number(a.balance || 0);
            const newBal = cleanColType === 'LOAN' ? Math.max(0, curBal - finalAmount) : (curBal + finalAmount);
            return { ...a, balance: newBal, dueAmount: Math.max(0, (Number(a.dueAmount || 0) - finalAmount)) };
          }
          return a;
        }));

        playPaymentSuccessNotification({
          amount: finalAmount,
          mode: 'CASH',
          customerName: qrAccount.accountHolder,
          accountNumber: qrAccount.accountNumber,
          transactionId: txnId
        });

        showToast(\`💵 Cash Payment of ₹\${finalAmount.toLocaleString('en-IN')} received & recorded! (Txn ID: \${txnId})\`);
      } else {
        const errMsg = resData.message || resData.responseMessage || 'Cash collection could not be recorded.';
        setCashError(errMsg);
        showToast(errMsg, 'error');
      }
    } catch (err) {
      console.error('❌ [Cash Collection Engine] Error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Cash Collection API Failed';
      setCashError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setCashLoading(false);
    }`;

const newCashCall = `    setCashLoading(true);
    setCashError(null);
    try {
      if (isNonIntegrated) {
        console.log('⚡ [Standalone Cash Engine] Processing isolated Mode N cash collection...');
        const result = await processStandaloneCashCollection({
          account: qrAccount,
          amount: finalAmount,
          user: authUser,
          agent: matchedAgent,
          branch: matchedBranch,
          note: qrNote
        });

        if (result.success) {
          setCashData({
            status: 'SUCCESS',
            amount: finalAmount,
            transactionId: result.receipt.transactionId,
            receiptNumber: result.receipt.receiptNumber,
            message: 'Cash collection successfully recorded in Standalone Ledger (No external CBS required).',
            timestamp: new Date().toISOString(),
            customerName: qrAccount.accountHolder,
            accountNumber: qrAccount.accountNumber,
            collectionType: cleanColType,
            agentName: agentNameStr
          });

          // Deduct from local ledger balance and today's due demand
          setAccounts(prev => (prev || []).map(a => {
            if (a.accountNumber === qrAccount.accountNumber) {
              const curBal = Number(a.balance || 0);
              const newBal = cleanColType === 'LOAN' ? Math.max(0, curBal - finalAmount) : (curBal + finalAmount);
              return {
                ...a,
                balance: newBal,
                outstandingAmount: newBal,
                dueAmount: Math.max(0, Number(a.dueAmount || a.emiAmount || 0) - finalAmount),
                lastPaidDate: new Date().toISOString().split('T')[0]
              };
            }
            return a;
          }));

          showToast(\`💵 Standalone Cash Payment of ₹\${finalAmount.toLocaleString('en-IN')} recorded successfully!\`);
          return;
        }
      }

      console.log('📡 [Cash Collection Engine] Calling processCashCollection with payload:', payload);
      const res = await paymentApi.processCashCollection(payload);
      console.log('✅ [Cash Collection Engine] Response received:', res.data);

      const resData = res.data || {};
      const statusStr = (resData.status || resData.Status || '').toString().toUpperCase();
      const isSuccess = statusStr === 'Y' || statusStr === '1' || statusStr === 'SUCCESS' || resData.status === true;

      if (isSuccess) {
        const txnId = resData.transactionId || resData.TransactionId || resData.receipt?.TRAN_ID || \`CASH-\${Date.now().toString().slice(-6)}\`;
        setCashData({
          status: 'SUCCESS',
          amount: finalAmount,
          transactionId: txnId,
          message: resData.message || 'Cash collection successfully posted to CBS core banking system.',
          timestamp: new Date().toISOString(),
          customerName: qrAccount.accountHolder,
          accountNumber: qrAccount.accountNumber,
          collectionType: cleanColType,
          agentName: agentNameStr
        });

        // Optimistically update account balance in state
        setAccounts(prev => (prev || []).map(a => {
          if (a.accountNumber === qrAccount.accountNumber) {
            const curBal = Number(a.balance || 0);
            const newBal = cleanColType === 'LOAN' ? Math.max(0, curBal - finalAmount) : (curBal + finalAmount);
            return { ...a, balance: newBal, dueAmount: Math.max(0, (Number(a.dueAmount || 0) - finalAmount)) };
          }
          return a;
        }));

        playPaymentSuccessNotification({
          amount: finalAmount,
          mode: 'CASH',
          customerName: qrAccount.accountHolder,
          accountNumber: qrAccount.accountNumber,
          transactionId: txnId
        });

        showToast(\`💵 Cash Payment of ₹\${finalAmount.toLocaleString('en-IN')} received & recorded! (Txn ID: \${txnId})\`);
      } else {
        const errMsg = resData.message || resData.responseMessage || 'Cash collection could not be recorded.';
        setCashError(errMsg);
        showToast(errMsg, 'error');
      }
    } catch (err) {
      console.error('❌ [Cash Collection Engine] Error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Cash Collection API Failed';
      setCashError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setCashLoading(false);
    }`;

if (code.includes(oldCashCall)) {
  code = code.replace(oldCashCall, newCashCall);
}

fs.writeFileSync(accountsPath, code, 'utf8');
console.log('✅ Accounts.jsx updated with separated standalone collection handling!');
