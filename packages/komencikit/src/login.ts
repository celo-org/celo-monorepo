import { Address } from '@celo/contractkit'
import { EIP712TypedData } from '@celo/utils/lib/sign-typed-data-utils'

export const buildLoginTypedData = (
  externalAccount: Address,
  captchaToken: string
): EIP712TypedData => {
  return {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
      ],
      Login: [
        { name: 'account', type: 'address' },
        { name: 'captcha', type: 'bytes' },
      ],
    },
    primaryType: 'Login',
    domain: {
      name: 'Komenci',
      version: '1.0',
    },
    message: {
      account: externalAccount,
      captcha: captchaToken,
    },
  }
}
