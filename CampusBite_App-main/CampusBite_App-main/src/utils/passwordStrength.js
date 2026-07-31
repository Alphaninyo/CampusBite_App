// Simple, dependency-free password strength scoring — no external library
// needed for a handful of length/character-class checks.
export function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: null };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Weak', color: '#EF4444' };
  if (score <= 3) return { score, label: 'Medium', color: '#F59E0B' };
  return { score, label: 'Strong', color: '#22C55E' };
}

export const PASSWORD_STRENGTH_MAX_SCORE = 5;
