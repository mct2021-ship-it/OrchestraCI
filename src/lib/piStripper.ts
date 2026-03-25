export function stripPIData(text: string): string {
  if (!text) return text;

  let stripped = text;

  // Strip email addresses
  stripped = stripped.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL REMOVED]');

  // Strip phone numbers (various formats)
  stripped = stripped.replace(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[PHONE REMOVED]');

  // Strip SSN (US)
  stripped = stripped.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN REMOVED]');

  // Strip credit card numbers
  stripped = stripped.replace(/\b(?:\d[ -]*?){13,16}\b/g, '[CARD REMOVED]');

  // Strip IP addresses
  stripped = stripped.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP REMOVED]');

  return stripped;
}
