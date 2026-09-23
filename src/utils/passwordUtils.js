// Shared password strength rule for ELEVORA account creation / password
// changes: 8+ chars, at least one uppercase, one lowercase, one digit, and
// one special character.
export const PASSWORD_HELP = 'Use 8+ characters with uppercase, lowercase, a number and a special character.';

export function passwordIssues(password) {
  const issues = [];
  if (!password || password.length < 8) issues.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) issues.push('One uppercase letter');
  if (!/[a-z]/.test(password)) issues.push('One lowercase letter');
  if (!/[0-9]/.test(password)) issues.push('One digit');
  if (!/[^A-Za-z0-9]/.test(password)) issues.push('One special character');
  return issues;
}

export function isPasswordValid(password) {
  return passwordIssues(password).length === 0;
}
