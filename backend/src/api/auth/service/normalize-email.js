import validator from 'validator';
export function normalizeAuthEmail(email) {
  return validator.normalizeEmail(email.trim(), { all_lowercase: true }) || email.trim().toLowerCase();
}
