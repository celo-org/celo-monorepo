import { EncryptionKeySigner } from '@celo/identity/lib/odis/query'
import { AuthenticationMethod } from '@celo/phone-number-privacy-common'
import {
  ensureLeading0x,
  normalizeAddressWith0x,
  privateKeyToAddress,
} from '@celo/utils/lib/address'

export const PRIVATE_KEY = '2c63bf6d60b16c8afa13e1069dbe92fef337c23855fff8b27732b3e9c6e7efd4'
export const ACCOUNT_ADDRESS = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY)) // 0x6037800e91eaa703e38bad40c01410bbdf0fea7e

interface DEK {
  privateKey: string
  publicKey: string
  address: string
}

export const deks: DEK[] = [
  {
    privateKey: 'bf8a2b73baf8402f8fe906ad3f42b560bf14b39f7df7797ece9e293d6f162188',
    publicKey: '034846bc781cacdafc66f3a77aa9fc3c56a9dadcd683c72be3c446fee8da041070',
    address: '0x7b33dF2607b85e3211738a49A6Ad6E8Ed4d13F6E',
  },
  {
    privateKey: '0975b0c565abc75b6638a749ea3008cb52676af3eabe4b80e19c516d82330364',
    publicKey: '03b1ac8c445f0796978018c087b97e8213b32c39e6a8642ae63dce71da33a19f65',
    address: '0x34332049B07Fab9a2e843A7C8991469d93cF6Ae6',
  },
]

// The following code can be used to generate more test DEKs
// const generateDEKs = (n: number): Promise<DEK[]> => Promise.all([...Array(n).keys()].map(
//   async () => await deriveDek(await generateMnemonic())
// ))

export const dekAuthSigner = (index: number): EncryptionKeySigner => {
  return {
    authenticationMethod: AuthenticationMethod.ENCRYPTION_KEY,
    rawKey: ensureLeading0x(deks[index].privateKey),
  }
}

export function generateRandomPhoneNumber() {
  const min = 1000000000 // Smallest 10-digit number
  const max = 9999999999 // Largest 10-digit number
  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min
  return '+1' + randomNumber.toString()
}
