
let reminderInterval = null;
let audioContext = null;

/* =========================================================
   NOTIFICATION PERMISSION
========================================================= */

export async function requestNotificationPermission() {
  if (typeof window === 'undefined') {
    return false;
  }

  if (!('Notification' in window)) {
    console.warn('Browser notifications are not supported.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();

    return permission === 'granted';
  } catch (error) {
    console.warn(
      'Could not request notification permission:',
      error
    );

    return false;
  }
}


/* =========================================================
   REMINDER SOUND
========================================================= */

export async function playReminderSound() {
  try {
    if (typeof window === 'undefined') {
      return;
    }

    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContext) {
      console.warn(
        'Web Audio API is not supported by this browser.'
      );

      return;
    }

    if (!audioContext) {
      audioContext = new AudioContext();
    }

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const now = audioContext.currentTime;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';

    // Pleasant notification tone
    oscillator.frequency.setValueAtTime(
      880,
      now
    );

    oscillator.frequency.setValueAtTime(
      988,
      now + 0.18
    );

    oscillator.frequency.setValueAtTime(
      880,
      now + 0.36
    );

    // Start almost silent
    gainNode.gain.setValueAtTime(
      0.0001,
      now
    );

    // Fade in
    gainNode.gain.exponentialRampToValueAtTime(
      0.25,
      now + 0.04
    );

    // Fade out
    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      now + 0.75
    );

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.75);

    oscillator.onended = () => {
      try {
        oscillator.disconnect();
        gainNode.disconnect();
      } catch {
        // Nothing to clean up
      }
    };

  } catch (error) {
    console.warn(
      'Could not play reminder sound:',
      error
    );
  }
}


/* =========================================================
   TEST SOUND
========================================================= */

export async function testReminderSound() {
  await playReminderSound();
}


/* =========================================================
   DAILY REMINDER STORAGE
========================================================= */

function getTodayKey() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(
    today.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    today.getDate()
  ).padStart(2, '0');

  return `study-reminder-${year}-${month}-${day}`;
}


function hasReminderPlayedToday() {
  try {
    return (
      localStorage.getItem(
        getTodayKey()
      ) === 'true'
    );
  } catch {
    return false;
  }
}


function markReminderPlayed() {
  try {
    localStorage.setItem(
      getTodayKey(),
      'true'
    );
  } catch {
    // Ignore storage errors.
  }
}


/* =========================================================
   TIME HELPERS
========================================================= */

function normalizeTime(time) {
  if (!time) {
    return null;
  }

  const value = String(time).trim();

  // Handles:
  // 07:30
  // 07:30:00
  // 19:30
  const match = value.match(
    /^(\d{1,2}):(\d{2})/
  );

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return {
    hours,
    minutes,
  };
}


function isStartTime(startTime) {
  const parsed = normalizeTime(startTime);

  if (!parsed) {
    return false;
  }

  const now = new Date();

  return (
    now.getHours() === parsed.hours &&
    now.getMinutes() === parsed.minutes
  );
}


/* =========================================================
   STUDY NOTIFICATION
========================================================= */

function showStudyNotification(goal) {
  if (
    typeof window === 'undefined' ||
    !('Notification' in window)
  ) {
    return;
  }

  if (
    Notification.permission !== 'granted'
  ) {
    return;
  }

  try {
    new Notification('Study Reminder', {
      body: goal
        ? `Time to work toward: ${goal}`
        : 'Your daily learning session is starting.',

      icon: '/favicon.ico',

      tag: 'study-reminder',

      renotify: false,

      silent: true,
    });
  } catch (error) {
    console.warn(
      'Could not show study notification:',
      error
    );
  }
}


/* =========================================================
   STOP EXISTING REMINDER
========================================================= */

export function stopStudyReminder() {
  if (reminderInterval !== null) {
    window.clearInterval(
      reminderInterval
    );

    reminderInterval = null;
  }
}


/* =========================================================
   START DAILY STUDY REMINDER
========================================================= */

export async function startStudyReminder({
  startTime,
  goal,
  enabled = true,
}) {
  // Always stop an existing timer first.
  stopStudyReminder();

  // Reminder disabled.
  if (!enabled) {
    return;
  }

  // No valid time.
  if (!normalizeTime(startTime)) {
    console.warn(
      'Study reminder disabled: invalid start time.',
      startTime
    );

    return;
  }

  /*
   * Ask for notification permission.
   *
   * Even if the user denies it, the sound can still
   * work while the page is open.
   */
  await requestNotificationPermission();


  /* -------------------------------------------------------
     Check the reminder
  ------------------------------------------------------- */

  const checkReminder = async () => {
    // Already triggered today.
    if (hasReminderPlayedToday()) {
      return;
    }

    // Not the scheduled minute.
    if (!isStartTime(startTime)) {
      return;
    }

    /*
     * Mark FIRST.
     *
     * This prevents duplicate notifications if multiple
     * checks happen during the same minute.
     */
    markReminderPlayed();

    // Browser notification
    showStudyNotification(goal);

    // Beep sound
    await playReminderSound();
  };


  /*
   * Check immediately.
   *
   * This is useful when the user opens/refreshed the app
   * exactly at the scheduled time.
   */
  await checkReminder();


  /*
   * Check every 10 seconds.
   *
   * This gives better accuracy than the old 30-second
   * interval.
   */
  reminderInterval = window.setInterval(
    checkReminder,
    10 * 1000
  );
}
