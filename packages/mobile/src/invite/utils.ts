import { sanitizeBase64 } from '@celo/walletkit'
import URLSearchParamsReal from '@ungap/url-search-params'
import RNInstallReferrer from 'react-native-install-referrer'
import Logger from 'src/utils/Logger'

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

interface ReferrerData {
  clickTimestamp: string
  installReferrer: string
  installTimestamp: string
}

interface ReferrerDataError {
  message: string
}

export const getInviteCodeFromReferrerData = async () => {
  const referrerData: ReferrerData | ReferrerDataError = await RNInstallReferrer.getReferrer()
  Logger.info(
    'invite/utils/getInviteCodeFromReferrerData',
    'Referrer Data: ' + JSON.stringify(referrerData)
  )
  if (referrerData && referrerData.hasOwnProperty('installReferrer')) {
    const params = new URLSearchParamsReal(
      decodeURIComponent((referrerData as ReferrerData).installReferrer)
    )
    const inviteCode = params.get('invite-code')
    if (inviteCode) {
      return inviteCode.replace(' ', '+')
    }
  }
  return null
}
