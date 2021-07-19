export function obfuscateNumber(phoneNumber: string): string {
  try {
    return phoneNumber.slice(0, 7) + '...'
  } catch {
    return ''
  }
}
