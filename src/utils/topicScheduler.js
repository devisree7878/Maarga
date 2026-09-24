/**
 * MAARGA Topic Scheduler
 *
 * Converts extracted learning topics into daily activities.
 */

/**
 * Clean a topic title.
 */
function cleanTopic(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/^[•●▪◦■□◆◇\-–—*]+\s*/, '')
    .replace(/^\s*\d+[\s.)-]+/, '')
    .trim();
}

/**
 * Remove duplicate topics while preserving order.
 */
function uniqueTopics(topics) {
  const seen = new Set();

  return topics.filter((topic) => {
    const key = topic.toLowerCase().trim();

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

/**
 * Decide whether a line looks like a useful topic.
 */
function looksLikeTopic(line) {
  const value = cleanTopic(line);

  if (!value) return false;
  if (value.length < 3) return false;
  if (value.length > 180) return false;

  // Ignore common document noise.
  const ignored = [
    'contents',
    'table of contents',
    'references',
    'bibliography',
    'introduction',
    'conclusion',
    'page',
    'copyright',
    'www.',
    'http://',
    'https://',
  ];

  const lower = value.toLowerCase();

  if (ignored.some((item) => lower === item)) {
    return false;
  }

  // Ignore lines that are mostly punctuation/numbers.
  if (/^[\d\s./,:;()\-]+$/.test(value)) {
    return false;
  }

  return true;
}

/**
 * Extract topics from plain text.
 *
 * Supports:
 * 1. Numbered lists
 * 2. Bullet lists
 * 3. Markdown headings
 * 4. Short standalone lines
 */
export function extractTopicsFromText(text) {
  if (!text) return [];

  const lines = text
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const topics = [];

  for (const line of lines) {
    const isHeading =
      /^#{1,6}\s+/.test(line) ||
      /^\d+[\s.)-]+\S+/.test(line) ||
      /^[•●▪◦■□◆◇\-–—*]\s+\S+/.test(line);

    if (isHeading || looksLikeTopic(line)) {
      const topic = cleanTopic(line);

      if (looksLikeTopic(topic)) {
        topics.push(topic);
      }
    }
  }

  return uniqueTopics(topics);
}

/**
 * Detect an existing schedule such as:
 *
 * Day 1
 * Topic A
 * Topic B
 *
 * Day 2
 * Topic C
 *
 * Returns null if no reliable day-wise structure exists.
 */
export function detectExistingSchedule(text) {
  if (!text) return null;

  const lines = text
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim());

  const days = [];
  let currentDay = null;

  for (const line of lines) {
    if (!line) continue;

    const match = line.match(
      /^(?:day|week|session)\s*[-:]?\s*(\d+)\s*$/i
    );

    if (match) {
      if (currentDay && currentDay.topics.length > 0) {
        days.push(currentDay);
      }

      currentDay = {
        dayNumber: Number(match[1]),
        topics: [],
      };

      continue;
    }

    if (currentDay && looksLikeTopic(line)) {
      const topic = cleanTopic(line);

      if (topic) {
        currentDay.topics.push(topic);
      }
    }
  }

  if (currentDay && currentDay.topics.length > 0) {
    days.push(currentDay);
  }

  if (days.length === 0) {
    return null;
  }

  const validDays = days.filter((day) => day.topics.length > 0);

  if (validDays.length < 2) {
    return null;
  }

  return validDays;
}

/**
 * Distribute topics across selected number of days.
 *
 * Example:
 *
 * 30 topics / 10 days
 * → 3 topics each day
 *
 * 30 topics / 7 days
 * → 5,5,4,4,4,4,4
 */
export function distributeTopics(topics, totalDays) {
  const clean = uniqueTopics(topics);
  const days = Math.max(1, Number(totalDays) || 1);

  if (clean.length === 0) {
    return [];
  }

  const result = [];

  const base = Math.floor(clean.length / days);
  const remainder = clean.length % days;

  let topicIndex = 0;

  for (let day = 1; day <= days; day++) {
    // Give one extra topic to the first `remainder` days.
    const count = base + (day <= remainder ? 1 : 0);

    const dayTopics = clean.slice(
      topicIndex,
      topicIndex + count
    );

    topicIndex += count;

    result.push({
      dayNumber: day,
      topics: dayTopics,
    });
  }

  return result;
}

/**
 * Create Supabase activity records.
 */
export function createActivityRows({
  userId,
  schedule,
  startDate = null,
}) {
  const rows = [];

  schedule.forEach((day) => {
    day.topics.forEach((topic) => {
      let scheduledDate = null;

      if (startDate) {
        const date = new Date(`${startDate}T00:00:00`);

        date.setDate(
          date.getDate() + (day.dayNumber - 1)
        );

        scheduledDate = date
          .toISOString()
          .slice(0, 10);
      }

      rows.push({
        user_id: userId,
        day_number: day.dayNumber,
        title: topic,
        activity_type: 'study',
        status: 'pending',
        scheduled_date: scheduledDate,
      });
    });
  });

  return rows;
}