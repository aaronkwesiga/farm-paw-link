import { Language } from "@/contexts/LanguageContext";

interface TimeUnit {
  unit: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';
  value: number;
}

const timeTranslations: Record<Language, {
  justNow: string;
  ago: string;
  second: string;
  seconds: string;
  minute: string;
  minutes: string;
  hour: string;
  hours: string;
  day: string;
  days: string;
  week: string;
  weeks: string;
  month: string;
  months: string;
  year: string;
  years: string;
}> = {
  en: {
    justNow: "just now",
    ago: "ago",
    second: "second",
    seconds: "seconds",
    minute: "minute",
    minutes: "minutes",
    hour: "hour",
    hours: "hours",
    day: "day",
    days: "days",
    week: "week",
    weeks: "weeks",
    month: "month",
    months: "months",
    year: "year",
    years: "years",
  },
  runyankole: {
    justNow: "hati",
    ago: "ebwaihire",
    second: "obuzibu",
    seconds: "obuzibu",
    minute: "edakiika",
    minutes: "edakiika",
    hour: "eshaaha",
    hours: "amashaaha",
    day: "eizooba",
    days: "ennaku",
    week: "eshabiiki",
    weeks: "eshabiiki",
    month: "omwezi",
    months: "emyezi",
    year: "omwaka",
    years: "emyaka",
  },
  rukiga: {
    justNow: "hati",
    ago: "eyahwire",
    second: "obuzibu",
    seconds: "obuzibu",
    minute: "edakiika",
    minutes: "edakiika",
    hour: "eshaaha",
    hours: "amashaaha",
    day: "eizooba",
    days: "ennaku",
    week: "eshabiiki",
    weeks: "eshabiiki",
    month: "omwezi",
    months: "emyezi",
    year: "omwaka",
    years: "emyaka",
  },
  runyoro: {
    justNow: "hati",
    ago: "ebyahwire",
    second: "obuzibu",
    seconds: "obuzibu",
    minute: "edakiika",
    minutes: "edakiika",
    hour: "esaawa",
    hours: "amasaawa",
    day: "eizooba",
    days: "ennaku",
    week: "esabiiti",
    weeks: "esabiiti",
    month: "omwezi",
    months: "emyezi",
    year: "omwaka",
    years: "emyaka",
  },
  rutooro: {
    justNow: "hati",
    ago: "ebyahwire",
    second: "obuzibu",
    seconds: "obuzibu",
    minute: "edakiika",
    minutes: "edakiika",
    hour: "esaawa",
    hours: "amasaawa",
    day: "eizooba",
    days: "ennaku",
    week: "esabiiti",
    weeks: "esabiiti",
    month: "omwezi",
    months: "emyezi",
    year: "omwaka",
    years: "emyaka",
  },
};

function getTimeUnit(diffInSeconds: number): TimeUnit {
  const minute = 60;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30;
  const year = day * 365;

  if (diffInSeconds < minute) {
    return { unit: 'second', value: Math.floor(diffInSeconds) };
  } else if (diffInSeconds < hour) {
    return { unit: 'minute', value: Math.floor(diffInSeconds / minute) };
  } else if (diffInSeconds < day) {
    return { unit: 'hour', value: Math.floor(diffInSeconds / hour) };
  } else if (diffInSeconds < week) {
    return { unit: 'day', value: Math.floor(diffInSeconds / day) };
  } else if (diffInSeconds < month) {
    return { unit: 'week', value: Math.floor(diffInSeconds / week) };
  } else if (diffInSeconds < year) {
    return { unit: 'month', value: Math.floor(diffInSeconds / month) };
  } else {
    return { unit: 'year', value: Math.floor(diffInSeconds / year) };
  }
}

export function formatRelativeTime(date: Date | string, language: Language): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

  // Handle future dates or very recent
  if (diffInSeconds < 5) {
    return timeTranslations[language].justNow;
  }

  const { unit, value } = getTimeUnit(diffInSeconds);
  const translations = timeTranslations[language];

  // Get the correct singular/plural form
  const unitKey = value === 1 ? unit : `${unit}s` as keyof typeof translations;
  const unitText = translations[unitKey];

  // Format based on language
  if (language === 'en') {
    return `${value} ${unitText} ${translations.ago}`;
  } else {
    // For Ugandan languages, format is typically: "value unit ago"
    return `${unitText} ${value} ${translations.ago}`;
  }
}

export function formatLocalizedDate(date: Date | string, language: Language): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  
  // Use locale-aware date formatting
  const localeMap: Record<Language, string> = {
    en: 'en-UG',
    runyankole: 'en-UG',
    rukiga: 'en-UG',
    runyoro: 'en-UG',
    rutooro: 'en-UG',
  };

  return targetDate.toLocaleDateString(localeMap[language], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
