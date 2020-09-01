import { newKit } from '@celo/contractkit'
import {
  AuthenticationMethod,
  EncryptionKeySigner,
  ServiceContext,
  WalletKeySigner,
} from '@celo/contractkit/lib/identity/odis/query'
import { PhoneNumberUtils } from '@celo/utils'
import { normalizeAddressWith0x, privateKeyToAddress } from '@celo/utils/lib/address'
import 'isomorphic-fetch'
import { getBlindedPhoneNumber } from '../../../common/test/utils'

/**
 * CONSTS
 */
export const ODIS_COMBINER =
  process.env.ODIS_COMBINER_SERVICE_URL ||
  'https://us-central1-celo-phone-number-privacy-stg.cloudfunctions.net'
export const DEFAULT_FORNO_URL =
  process.env.ODIS_BLOCKCHAIN_PROVIDER || 'https://alfajoresstaging-forno.celo-testnet.org'

export const PRIVATE_KEY = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
export const ACCOUNT_ADDRESS = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY)) // 0x1be31a94361a391bbafb2a4ccd704f57dc04d4bb

export const PRIVATE_KEY_NO_QUOTA =
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890000000'
export const ACCOUNT_ADDRESS_NO_QUOTA = privateKeyToAddress(PRIVATE_KEY_NO_QUOTA)

export const PHONE_NUMBER = '+14155550123'
export const BLINDING_FACTOR = new Buffer('0IsBvRfkBrkKCIW6HV0/T1zrzjQSe8wRyU3PKojCnww=', 'base64')
export const BLINDED_PHONE_NUMBER = getBlindedPhoneNumber(PHONE_NUMBER, BLINDING_FACTOR)

export const SERVICE_CONTEXT: ServiceContext = {
  odisUrl: ODIS_COMBINER,
  odisPubKey:
    '7FsWGsFnmVvRfMDpzz95Np76wf/1sPaK0Og9yiB+P8QbjiC8FV67NBans9hzZEkBaQMhiapzgMR6CkZIZPvgwQboAxl65JWRZecGe5V3XO4sdKeNemdAZ2TzQuWkuZoA',
}

export const PHONE_HASH_IDENTIFIER = PhoneNumberUtils.getPhoneHash(PHONE_NUMBER)

export const CONTACT_PHONE_NUMBER = '+14155559999'
export const CONTACT_PHONE_NUMBERS = [CONTACT_PHONE_NUMBER]

/**
 * RESOURCES AND UTILS
 */
export const contractKit = newKit(DEFAULT_FORNO_URL)
contractKit.addAccount(PRIVATE_KEY_NO_QUOTA)
contractKit.addAccount(PRIVATE_KEY)
contractKit.defaultAccount = ACCOUNT_ADDRESS

export const dekAuthSigner: EncryptionKeySigner = {
  authenticationMethod: AuthenticationMethod.ENCRYPTION_KEY,
  rawKey: '41e8e8593108eeedcbded883b8af34d2f028710355c57f4c10a056b72486aa04',
}

export const walletAuthSigner: WalletKeySigner = {
  authenticationMethod: AuthenticationMethod.WALLET_KEY,
  contractKit,
}
