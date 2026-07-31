import { Platform } from 'react-native';
// expo-file-system's default export (SDK 54+) is the new File/Directory API,
// which has no cacheDirectory/writeAsStringAsync — those only exist on the
// /legacy subpath. Importing the default here silently no-ops every call
// below and gets swallowed by the catch, producing "Download Failed" with
// no clue why.
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

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

// Returns true once the file has been downloaded (web) or handed off to the
// native share sheet (iOS/Android — the user picks "Save to Files", a Drive
// app, email, etc. from there). Callers should show their own fallback alert
// only when this returns false (sharing genuinely unavailable or write failed).
export async function downloadCSVReport(filename, csvText) {
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

  try {
    const fileUri = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(fileUri, csvText, { encoding: FileSystem.EncodingType.UTF8 });
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) return false;
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: filename,
      UTI: 'public.comma-separated-values-text',
    });
    return true;
  } catch (error) {
    console.error('downloadCSVReport failed:', error);
    return false;
  }
}
