import { ClientOptions, ClientTypes } from '@walletconnect/types'

export enum SupportedMethods {
  accounts = 'eth_accounts',
  signTransaction = 'eth_signTransaction',
  personalSign = 'personal_sign',
  signTypedData = 'eth_signTypedData',
  decrypt = 'personal_decrypt',
  computeSharedSecret = 'personal_computeSharedSecret',
}

/**
 * Utility for making the API of this package nicer.
 *
 * We want to force passing metadata (name, description, etc), but not permissions,
 * which will likely remain static across dapps.
 */
type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>
type ConnectOptions = Optional<ClientTypes.ConnectParams, 'permissions'>

export interface WalletConnectWalletOptions {
  init?: ClientOptions
  connect?: ConnectOptions
}
