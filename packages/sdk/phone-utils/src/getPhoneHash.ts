import { getPhoneHash as baseGetPhoneHash } from '@celo/base/lib/phoneNumbers'
import { soliditySha3 } from 'web3-utils'

const sha3 = (v: string): string | null => soliditySha3({ type: 'string', value: v })
const getPhoneHash = (phoneNumber: string, salt?: string): string => {
  return baseGetPhoneHash(sha3, phoneNumber, salt)
}

export default getPhoneHash
