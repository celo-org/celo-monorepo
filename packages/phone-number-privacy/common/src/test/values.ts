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
export const DEK_PUBLIC_KEY = '0x026063780c81991c032fb4fa7485c6607b7542e048ef85d08516fe5c4482360e4b'
export const DEK_PRIVATE_KEY = '0xc2bbdabb440141efed205497a41d5fb6114e0435fd541e368dc628a8e086bfee'

// Public keys are expected to be in base64
export const PNP_DEV_ODIS_PUBLIC_KEY =
  'HzMTasAppwLrBBCWvZ7wncnDaN3lKpcoZr3q/wiW+FlrdKt639cxi7o4UnWZdoQA30S8q2a884Q8F6LOg4vNWouhY0wYMU/wVlp8dpkFuKj7onqGv0xssi34nhut/iuB'
export const PNP_DEV_SIGNER_PRIVATE_KEY =
  '00000000dd0005bf4de5f2f052174f5cf58dae1af1d556c7f7f85d6fb3656e1d0f10720f'
export const PNP_DEV_ODIS_POLYNOMIAL =
  '01000000000000001f33136ac029a702eb041096bd9ef09dc9c368dde52a972866bdeaff0896f8596b74ab7adfd7318bba38527599768400df44bcab66bcf3843c17a2ce838bcd5a8ba1634c18314ff0565a7c769905b8a8fba27a86bf4c6cb22df89e1badfe2b81'

// Public keys are expected to be in base64
export const DOMAINS_DEV_ODIS_PUBLIC_KEY =
  'CyJK6fkM0ZRILiW0h85LFev4BbMcLH1RBX5I9BNDgwX5jM74kv8+FjFZuJ1C4P0ADU1fuPGXXQg+wAGCclUD+BCza6ItIxSYmwsZ4ie1Iw1/pdTcwPJJlXwYwcDo+LKA'
export const DOMAINS_DEV_SIGNER_PRIVATE_KEY =
  '01000000f0c2d6231c9ed833da9478cbfd6e4970fcd893e156973862f6d286e7e1f6d904'
export const DOMAINS_DEV_ODIS_POLYNOMIAL =
  '01000000000000000b224ae9f90cd194482e25b487ce4b15ebf805b31c2c7d51057e48f413438305f98ccef892ff3e163159b89d42e0fd000d4d5fb8f1975d083ec00182725503f810b36ba22d2314989b0b19e227b5230d7fa5d4dcc0f249957c18c1c0e8f8b280'
