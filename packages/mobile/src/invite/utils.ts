import { trimLeading0x } from '@celo/utils/src/address'
import { sanitizeMessageBase64 } from '@celo/utils/src/attestations'
import dynamicLinks from '@react-native-firebase/dynamic-links'
import URLSearchParamsReal from '@ungap/url-search-params'
import url from 'url'

export type ExtractedInviteCodeAndPrivateKey = null | {
  inviteCode: string
  privateKey: string
}

export const createInviteCode = (privateKey: string) => {
  // TODO(Rossy) we need some scheme to encrypt this PK
  // Buffer.from doesn't expect a 0x for hex input
  return Buffer.from(trimLeading0x(privateKey), 'hex').toString('base64')
}

// exported for testing
export const parseInviteFieldInput = (
  inviteFieldInput: string
): ExtractedInviteCodeAndPrivateKey => {
  const sanitizedCode = sanitizeMessageBase64(inviteFieldInput)
  const regex = new RegExp('([0-9A-Za-z/\\+\\-\\_]*=)')
  const matches = sanitizedCode.match(regex)
  if (matches == null || matches.length === 0) {
    return null
  }
  return {
    inviteCode: matches[0],
    privateKey: '0x' + Buffer.from(matches[0], 'base64').toString('hex'),
  }
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

export function extractInviteCodeAndPrivateKey(
  inviteFieldInput: string
): ExtractedInviteCodeAndPrivateKey {
  const parsedValues: ExtractedInviteCodeAndPrivateKey = parseInviteFieldInput(inviteFieldInput)
  if (!parsedValues) {
    return null
  }

  if (!isValidPrivateKey(parsedValues.privateKey)) {
    return null
  }

  return parsedValues
}

export const extractValuesFromDeepLink = async (): Promise<ExtractedInviteCodeAndPrivateKey> => {
  const deepLinkWithInviteCode = await dynamicLinks().getInitialLink()

  if (deepLinkWithInviteCode) {
    const parsedUrl = url.parse(deepLinkWithInviteCode.url)
    if (parsedUrl.query) {
      const params = new URLSearchParamsReal(decodeURIComponent(parsedUrl.query))
      const code: string = params.get('invite-code')
      if (code) {
        const sanitizedCode = code.replace(' ', '+')
        // Accept invite codes which are either base64 encoded or direct hex keys
        if (isValidPrivateKey(sanitizedCode)) {
          return { inviteCode: sanitizedCode, privateKey: sanitizedCode }
        }
        return extractInviteCodeAndPrivateKey(sanitizedCode)
      }
    }
  }
  return null
}
