import { sanitizeBase64 } from '@celo/contractkit'

export const createInviteCode = (privateKey: string) => {
  // TODO(Rossy) we need some scheme to encrypt this PK
  // Buffer.from doesn't expect a 0x for hex input
  const privateKeyHex = privateKey.substring(2)
  return Buffer.from(privateKeyHex, 'hex').toString('base64')
}

// exported for testing
export const extractInviteCode = (inviteFieldInput: string) => {
  const sanitizedCode = sanitizeBase64(inviteFieldInput)
  const regex = new RegExp('([0-9A-Za-z/\\+\\-\\_]*=)')
  const matches = sanitizedCode.match(regex)
  if (matches == null || matches.length === 0) {
    return null
  }
  return '0x' + Buffer.from(matches[0], 'base64').toString('hex')
}

// TODO(cmcewen): Consider web3 utils
export const isValidPrivateKey = (hexEncodedPrivateKey: string): boolean => {
  // First two chars are 0x
  if (hexEncodedPrivateKey.length !== 64 + 2) {
    return false
  }
  if (!hexEncodedPrivateKey.startsWith('0x')) {
    return false
  }
  return true
}

export function extractValidInviteCode(inviteFieldInput: string) {
  const inviteCode = extractInviteCode(inviteFieldInput)
  if (inviteCode == null || !isValidPrivateKey(inviteCode)) {
    return null
  } else {
    return inviteCode
  }
}
