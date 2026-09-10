/**
 * 🔊 High-Fidelity Audio Alert & Voice Announcement Utility for eCollect
 * Dispatches realistic fintech soundbox chimes and speech voice alerts for both Cash & UPI QR
 */

// 1. Synthesized Fintech Soundbox Chime (Web Audio API)
export const playPaymentChime = (mode = 'CASH') => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();

    // Sound profile:
    // Cash: Double warm ascending bell (C5 -> E5 -> G5)
    // UPI: Crisp high electronic fintech ping (D5 -> A5 -> D6)
    const isCash = mode?.toString().toUpperCase() === 'CASH';

    const now = ctx.currentTime;
    
    if (isCash) {
      // First Chime Tone (C5 - 523.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(523.25, now);
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.45);

      // Second Chime Tone (G5 - 783.99 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, now + 0.12);
      osc2.frequency.exponentialRampToValueAtTime(1046.50, now + 0.3); // C6
      gain2.gain.setValueAtTime(0.4, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.65);
    } else {
      // UPI QR Soundbox Chime (D5 -> A5 -> D6)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
      osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.25); // D6
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    }
  } catch (err) {
    console.warn('Audio chime playback notice:', err);
  }
};

// 2. Soundbox Voice Speech Announcement (e.g. "Received ₹500 on eCollect")
export const speakPaymentAnnouncement = (amount, mode = 'CASH', customerName = '') => {
  try {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Clear any pending speech

    const formattedAmount = Number(amount || 0).toLocaleString('en-IN');
    const isCash = mode?.toString().toUpperCase() === 'CASH';

    const text = isCash 
      ? `Received ${formattedAmount} rupees in cash on eCollect.`
      : `Received payment of ${formattedAmount} rupees via UPI on eCollect.`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;
    utterance.lang = 'en-IN';

    // Pick Indian English voice if available
    const voices = window.speechSynthesis.getVoices();
    const inVoice = voices.find(v => v.lang === 'en-IN' || v.name?.includes('India') || v.name?.includes('Hindi'));
    if (inVoice) {
      utterance.voice = inVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis alert notice:', err);
  }
};

// 3. Browser Push / Desktop Notification Dispatcher
export const triggerDesktopNotification = (title, body) => {
  try {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/logo.png', badge: '/logo.png' });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, { body, icon: '/logo.png', badge: '/logo.png' });
          }
        });
      }
    }
  } catch {
    // Desktop notification ignored
  }
};

// 4. Master Payment Receipt Sound & Notification Pipeline (for both QR and CASH)
export const playPaymentSuccessNotification = ({
  amount,
  mode = 'CASH',
  customerName = '',
  accountNumber = '',
  transactionId = ''
}) => {
  const finalMode = mode?.toString().toUpperCase() === 'CASH' ? 'CASH' : 'UPI';
  const finalAmount = Number(amount || 0);

  // 1. Play musical chime immediately
  playPaymentChime(finalMode);

  // 2. Speak voice announcement after brief chime delay (300ms)
  setTimeout(() => {
    speakPaymentAnnouncement(finalAmount, finalMode, customerName);
  }, 300);

  // 3. Dispatch desktop/browser push notification
  const title = finalMode === 'CASH' 
    ? '💵 Cash Collection Received!' 
    : '⚡ UPI Payment Verified!';
  
  const body = `₹${finalAmount.toLocaleString('en-IN')} received for Acc #${accountNumber || 'N/A'}${customerName ? ` (${customerName})` : ''} | Txn: ${transactionId || 'SUCCESS'}`;
  
  triggerDesktopNotification(title, body);

  // 4. Trigger global telemetry event for TopBar bell icon & notification counters
  try {
    window.dispatchEvent(new CustomEvent('transaction_created', {
      detail: {
        mode: finalMode,
        amount: finalAmount,
        account: accountNumber,
        customer: customerName,
        transactionId: transactionId,
        timestamp: new Date().toISOString()
      }
    }));
  } catch {
    // Dispatch fallback
  }
};

export default playPaymentSuccessNotification;
