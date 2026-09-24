
import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

function getDayDate(startDate, dayNumber) {
  const date = new Date(`${startDate}T00:00:00`);

  date.setDate(date.getDate() + Number(dayNumber) - 1);

  return date;
}

function getReminderDate(task, startDate) {
  if (!task.reminderTime || !task.dayNumber) return null;

  const date = getDayDate(startDate, task.dayNumber);

  const [hours, minutes] = task.reminderTime
    .split(':')
    .map(Number);

  date.setHours(hours, minutes, 0, 0);

  return date;
}

function playBeep() {
  try {
    const AudioContext =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) return;

    const context = new AudioContext();

    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 880;

    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.25,
      context.currentTime + 0.02
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + 0.5
    );

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + 0.5);

    oscillator.onended = () => {
      context.close();
    };
  } catch (error) {
    console.warn('Unable to play reminder sound:', error);
  }
}

function showNotification(task) {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    new Notification('Task Reminder', {
      body: `It's time for: ${task.title}`,
      icon: '/favicon.ico',
      tag: `task-reminder-${task.id}`,
    });
  }
}

export default function useTaskReminders() {
  const { data, updateTask } = useApp();
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    const checkReminders = () => {
      const currentData = dataRef.current;

      if (!currentData) return;

      if (!currentData.settings.notifications) return;

      const now = new Date();

      currentData.tasks.forEach((task) => {
        if (
          !task.reminderEnabled ||
          !task.reminderTime ||
          task.completed ||
          task.reminderTriggeredAt
        ) {
          return;
        }

        const reminderDate = getReminderDate(
          task,
          currentData.settings.startDate
        );

        if (!reminderDate) return;

        const difference = now.getTime() - reminderDate.getTime();

        // Trigger only within a 60-second window.
        if (difference >= 0 && difference < 60000) {
          if (currentData.settings.reminderSound) {
            playBeep();
          }

          showNotification(task);

          updateTask(task.id, {
            reminderTriggeredAt: now.toISOString(),
          });
        }
      });
    };

    checkReminders();

    const timer = setInterval(checkReminders, 10000);

    return () => clearInterval(timer);
  }, [updateTask]);
}

export { playBeep };