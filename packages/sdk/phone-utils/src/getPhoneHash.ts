import {
  getIdentifierHash,
  getPrefixedIdentifier,
  IdentifierPrefix,
} from '@celo/base/lib/identifier'
import { soliditySha3 } from 'web3-utils'

const sha3 = (v: string): string | null => soliditySha3({ type: 'string', value: v })
const getPhoneHash = (phoneNumber: string, salt?: string): string => {
  if (salt) {
    return getIdentifierHash(sha3, phoneNumber, IdentifierPrefix.PHONE_NUMBER, salt)
  }
  // TODO EN: backwards compatibility for old phoneUtils getPhoneHash
  return sha3(getPrefixedIdentifier(phoneNumber, IdentifierPrefix.PHONE_NUMBER)) as string
}

export default getPhoneHash
