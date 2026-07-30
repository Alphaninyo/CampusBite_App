import { Platform } from 'react-native';

export const REPORT_PERIODS = ['Today', 'This Week', 'This Month', 'All Time'];

export function filterByPeriod(items, period, dateField = 'created_at') {
  if (period === 'All Time') return items;
  const now = new Date();
  return items.filter((item) => {
    const d = new Date(item[dateField]);
    if (period === 'Today') return d.toDateString() === now.toDateString();
    if (period === 'This Week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return d >= weekAgo;
    }
    if (period === 'This Month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return true;
  });
}

export function csvCell(value) {
  const str = String(value ?? '');
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

// Returns true if the download actually happened (web). Callers should show
// their own native "coming soon" alert when this returns false.
export function downloadCSVReport(filename, csvText) {
  if (Platform.OS === 'web') {
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }
  return false;
}
