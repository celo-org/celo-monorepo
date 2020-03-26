export function isPhoneAuthSupported() {
  return false
}

export async function setPinInKeystore() {
  throw new Error('Not supported')
}

export async function getPinFromKeystore() {
  throw new Error('Not supported')
}
