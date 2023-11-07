import { soliditySha3 } from 'web3-utils'

const sha3 = (v: string): string | null => soliditySha3({ type: 'string', value: v })
const getPhoneHash = (phoneNumber: string, salt?: string): string => {
  if (salt) {
    return `0x${sha3(phoneNumber + salt)}`
  }
  // backwards compatibility for old phoneUtils getPhoneHash
  return 'no goood'
}

export default getPhoneHash
