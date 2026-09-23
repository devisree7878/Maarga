let reminderInterval = null;
let audioContext = null;

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

function playAlarmSound() {
  try {
    // Create the audio context after a user interaction
    // whenever possible.
    if (!audioContext) {
      audioContext = new (
        window.AudioContext || window.webkitAudioContext
      )();
    }

    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 880;

    gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();

    gainNode.gain.exponentialRampToValueAtTime(
      0.25,
      audioContext.currentTime + 0.05
    );

    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      audioContext.currentTime + 0.8
    );

    oscillator.stop(audioContext.currentTime + 0.8);
  } catch (error) {
    console.warn('Could not play reminder sound:', error);
  }
}

function getTodayKey() {
  const today = new Date();

  return `elevora-study-reminder-${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
}

function hasReminderPlayedToday() {
  return localStorage.getItem(getTodayKey()) === 'true';
}

function markReminderPlayed() {
  localStorage.setItem(getTodayKey(), 'true');
}

function isStartTime(startTime) {
  if (!startTime) return false;

  const now = new Date();

  const [hours, minutes] = startTime
    .slice(0, 5)
    .split(':')
    .map(Number);

  return (
    now.getHours() === hours &&
    now.getMinutes() === minutes
  );
}

function showStudyNotification(goal) {
  if (!('Notification' in window)) return;

  if (Notification.permission !== 'granted') return;

  new Notification('ELEVORA — Study Time', {
    body: goal
      ? `Time to work toward: ${goal}`
      : 'Your daily learning session is starting.',
    icon: '/favicon.ico',
    tag: 'elevora-study-reminder',
  });
}

export async function startStudyReminder({
  startTime,
  goal,
  enabled = true,
}) {
  stopStudyReminder();

  if (!enabled || !startTime) {
    return;
  }

  await requestNotificationPermission();

  const checkReminder = () => {
    if (hasReminderPlayedToday()) {
      return;
    }

    if (!isStartTime(startTime)) {
      return;
    }

    markReminderPlayed();

    showStudyNotification(goal);

    playAlarmSound();
  };

  // Check immediately
  checkReminder();

  // Then check every 30 seconds
  reminderInterval = window.setInterval(
    checkReminder,
    30 * 1000
  );
}

export function stopStudyReminder() {
  if (reminderInterval) {
    window.clearInterval(reminderInterval);
    reminderInterval = null;
  }
}