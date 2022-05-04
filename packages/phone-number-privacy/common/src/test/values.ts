import { PhoneNumberUtils } from '@celo/phone-utils'
import { normalizeAddressWith0x, privateKeyToAddress } from '@celo/utils/lib/address'
import { getBlindedPhoneNumber } from './utils'

export const mockAccount = '0x0000000000000000000000000000000000007E57'
export const mockPhoneNumber = '+14155556666'
export const mockContractAddress = '0x000000000000000000000000000000000000CE10'

export const PRIVATE_KEY1 = '535029bfb19fe5440dbd549b88fbf5ee847b059485e4eafc2a3e3bdfbf9b31ac'
export const ACCOUNT_ADDRESS1 = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY1))
export const PRIVATE_KEY2 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890fdeccc'
export const ACCOUNT_ADDRESS2 = privateKeyToAddress(PRIVATE_KEY2)
export const PRIVATE_KEY3 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890fffff1d'
export const ACCOUNT_ADDRESS3 = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY3))
export const PHONE_NUMBER = '+15555555555'
export const IDENTIFIER = PhoneNumberUtils.getPhoneHash(PHONE_NUMBER)
export const BLINDING_FACTOR = Buffer.from('0IsBvRfkBrkKCIW6HV0/T1zrzjQSe8wRyU3PKojCnww=', 'base64')
export const BLINDED_PHONE_NUMBER = getBlindedPhoneNumber(PHONE_NUMBER, BLINDING_FACTOR)
