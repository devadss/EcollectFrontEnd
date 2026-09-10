import { useEffect, useRef } from 'react';
import { reminderApi, accountApi, walletApi } from '../../services/api';
import { notificationService } from '../../services/notificationService';

/**
 * GlobalReminderWorker
 * Autonomous application-wide background worker that executes automated due reminder scans
 * and verifies Merchant Wallet Credits before dispatching WhatsApp, SMS, and Voice Calls.
 */
const GlobalReminderWorker = () => {
  const isRunningRef = useRef(false);

  useEffect(() => {
    // Check if system is in Non-Integrated Mode
    const checkIsNonIntegrated = () => {
      try {
        const authUser = JSON.parse(localStorage.getItem('auth_user') || localStorage.getItem('user') || '{}');
        const rawInteg = localStorage.getItem('integrationStatus') || authUser?.integrationStatus || authUser?.IntegrationStatus || 'No';
        return String(rawInteg).toUpperCase() !== 'Y' && String(rawInteg).toUpperCase() !== 'YES' && rawInteg !== true;
      } catch {
        return true;
      }
    };

    const runScheduledReminderJob = async (isManualOrInitial = false) => {
      if (isRunningRef.current) return;
      if (!checkIsNonIntegrated()) return; // Only unintegrated accounts need automated reminder bot

      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) return; // Only run when user is logged into the system

      const authUser = JSON.parse(localStorage.getItem('auth_user') || localStorage.getItem('user') || '{}');
      const merchantId = authUser?.merchantId || authUser?.merchant_id || localStorage.getItem('merchantId') || 1;

      isRunningRef.current = true;

      try {
        const now = new Date();
        const todayDateStr = now.toISOString().slice(0, 10);
        const currentHourMin = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

        // Retrieve global rules from config / localStorage
        const storedConfig = JSON.parse(localStorage.getItem('global_reminder_config') || '{}');
        const targetExecutionTime = storedConfig.dailyExecutionTime || storedConfig.scheduledExecutionTime || '08:00';
        const defaultDays = Number(storedConfig.defaultDaysBeforeDue || 2);
        const highRiskThreshold = Number(storedConfig.highRiskThreshold || 50000);

        // Check if already dispatched today at scheduled time (unless manual trigger)
        const lastRunKey = `last_reminder_job_run_${todayDateStr}`;
        const alreadyRunToday = localStorage.getItem(lastRunKey);

        const isTimeMatch = currentHourMin.startsWith(targetExecutionTime.slice(0, 5));

        // Trigger if time matches OR if it's the initial check and hasn't run today
        if (isManualOrInitial && alreadyRunToday) {
          isRunningRef.current = false;
          return;
        }

        if (!isManualOrInitial && !isTimeMatch) {
          isRunningRef.current = false;
          return;
        }

        console.log(`🤖 [Global Reminder Worker] Executing scheduled due scan for Merchant #${merchantId} at ${currentHourMin}...`);

        // Fetch unintegrated accounts
        let accounts = [];
        try {
          const res = await accountApi.getStandaloneAccounts({});
          accounts = Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res?.data) ? res.data : []);
        } catch (fetchErr) {
          console.warn('Global reminder worker could not query accounts API:', fetchErr);
        }

        // Identify due accounts
        const dueAccounts = accounts.filter(acc => {
          const dueVal = Number(acc.dueAmount || acc.demand || acc.emiAmount || 0);
          if (dueVal <= 0) return false;

          const rawNextDue = acc.nextDueDate || acc.next_due_date;
          if (!rawNextDue || rawNextDue === 'N/A') return true;

          try {
            const dueDate = new Date(rawNextDue);
            if (isNaN(dueDate.getTime())) return true;
            const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const leadTime = Number(acc.reminderDaysBeforeDue || defaultDays);
            return diffDays <= leadTime;
          } catch {
            return true;
          }
        });

        if (dueAccounts.length > 0) {
          const highRiskCount = dueAccounts.filter(a => Number(a.dueAmount || a.demand || 0) > highRiskThreshold).length;

          // 1. Check Merchant Communication Wallet Credits
          const walletRes = await walletApi.getBalance(merchantId);
          const currentWallet = walletRes?.data?.data || { balance: 0 };
          
          // Calculate expected batch cost
          const channelStr = storedConfig.enableWhatsApp && storedConfig.enableSms ? 'WhatsApp,SMS' : (storedConfig.enableWhatsApp ? 'WhatsApp' : 'SMS');
          const unitRate = (storedConfig.enableWhatsApp ? 0.45 : 0) + (storedConfig.enableSms ? 0.20 : 0) || 0.65;
          const totalBatchCost = Number((unitRate * dueAccounts.length).toFixed(2));

          if (currentWallet.balance < totalBatchCost) {
            console.warn(`⚠️ [Global Reminder Worker] Insufficient wallet credits (Required: ₹${totalBatchCost}, Available: ₹${currentWallet.balance}).`);
            
            // Post low balance alert to notification center
            try {
              await notificationService.addNotification({
                title: `⚠️ Communication Credits Exhausted (Merchant #${merchantId})`,
                message: `Automated morning reminder batch for ${dueAccounts.length} accounts was paused due to low wallet balance (Required: ₹${totalBatchCost}, Balance: ₹${currentWallet.balance.toFixed(2)}). Please recharge credits wallet.`,
                category: 'FINANCE',
                priority: 'HIGH',
                actionUrl: '/accounts',
                actionLabel: 'Recharge Wallet',
                meta: { required: totalBatchCost, currentBalance: currentWallet.balance }
              });
            } catch (notifErr) {}
            
            isRunningRef.current = false;
            return;
          }

          // 2. Dispatch reminders via API
          await reminderApi.triggerNow();

          // 3. Deduct from Merchant Wallet
          await walletApi.deductCredits({
            merchantId,
            channel: channelStr,
            recipientCount: dueAccounts.length,
            notes: `Automated scheduled reminder batch for ${dueAccounts.length} accounts (${highRiskCount} high-risk)`
          });

          // 4. Create notification in portal notification center
          try {
            await notificationService.addNotification({
              title: `Automated Due Reminders Dispatched (${dueAccounts.length} Accounts)`,
              message: `Automated reminder job successfully dispatched morning ${channelStr} notices to ${dueAccounts.length} due accounts (₹${totalBatchCost} deducted from credits wallet).`,
              category: 'SYSTEM',
              priority: highRiskCount > 0 ? 'HIGH' : 'INFO',
              actionUrl: '/accounts',
              actionLabel: 'View Accounts Ledger',
              meta: { dueCount: dueAccounts.length, highRiskCount, executionTime: currentHourMin, cost: totalBatchCost }
            });
          } catch (notifErr) {
            console.warn('Could not add system notification:', notifErr);
          }

          localStorage.setItem(lastRunKey, new Date().toISOString());
          console.log(`✅ [Global Reminder Worker] Dispatched automated notices for ${dueAccounts.length} accounts (Cost: ₹${totalBatchCost}).`);
          window.dispatchEvent(new Event('reminder_bot_synced'));
          window.dispatchEvent(new Event('wallet_updated'));
        }
      } catch (err) {
        console.warn('Global reminder background job execution note:', err);
      } finally {
        isRunningRef.current = false;
      }
    };

    // Initial check 5 seconds after application boot
    const initialTimer = setTimeout(() => {
      runScheduledReminderJob(true);
    }, 5000);

    // Continuous heartbeat check every 60 seconds across the entire app
    const heartbeatInterval = setInterval(() => {
      runScheduledReminderJob(false);
    }, 60000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(heartbeatInterval);
    };
  }, []);

  return null; // Headless global background worker
};

export default GlobalReminderWorker;
