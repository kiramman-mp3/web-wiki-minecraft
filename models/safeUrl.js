/**
 * Returns the normalised URL when `value` is a valid https URL,
 * otherwise `fallback`. Used for every URL that comes from Reddit.
 */
export function httpsUrl(value, fallback = '') {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : fallback;
  } catch {
    return fallback;
  }
}
