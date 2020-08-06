import { WritableWallet } from '@celo/contractkit/lib/wallets/wallet'
import { Tx } from 'web3-core'
import { RNGethSigner } from './RNGethSigner'
import {
  ensureLeading0x,
  normalizeAddressWith0x,
  privateKeyToAddress,
} from '@celo/utils/lib/address'
import { RemoteWallet } from '@celo/contractkit/lib/wallets/remote-wallet'
import RNGeth, { Account } from 'react-native-geth'
import Logger from '../utils/Logger'

export enum RNGethWalletErrors {
  FetchAccounts = 'RNGethWallet: failed to fetch accounts from geth wrapper',
  AccountAlreadyExists = 'RNGethWallet: account already exists',
}

const TAG = 'geth/RNGethWallet'

export class RNGethWallet extends RemoteWallet<RNGethSigner> implements WritableWallet {
  /**
   * Construct a React Native geth wallet which uses the bridge methods
   * instead of communicating with a node
   * @param geth The instance of the bridge object
   * @dev overrides WalletBase.signTransaction
   */
  constructor(private geth: RNGeth) {
    super()
  }

  async loadAccountSigners(): Promise<Map<string, RNGethSigner>> {
    let accounts: Account[]
    const addressToSigner = new Map<string, RNGethSigner>()
    try {
      accounts = await this.geth.listAccounts()
    } catch (e) {
      console.log(e)
      throw new Error(RNGethWalletErrors.FetchAccounts)
    }
    accounts.forEach(({ address }) => {
      const cleanAddress = normalizeAddressWith0x(address)
      addressToSigner.set(cleanAddress, new RNGethSigner(this.geth, cleanAddress))
    })
    return addressToSigner
  }

  async addAccount(privateKey: string, passphrase: string): Promise<string> {
    Logger.info(`${TAG}@addAccount`, `Adding a new account`)
    const address = normalizeAddressWith0x(privateKeyToAddress(ensureLeading0x(privateKey)))
    if (this.hasAccount(address)) {
      throw new Error(RNGethWalletErrors.AccountAlreadyExists)
    }
    const signer = new RNGethSigner(this.geth, address)
    const resultantAddress = await signer.init(privateKey, passphrase)
    this.addSigner(resultantAddress, signer)
    return resultantAddress
  }

  /**
   * Unlocks an account for a given duration
   * @param account String the account to unlock
   * @param passphrase String the passphrase of the account
   * @param duration Number the duration of the unlock period
   */
  async unlockAccount(account: string, passphrase: string, duration: number) {
    Logger.info(`${TAG}@unlockAccount`, `Unlocking ${account}`)
    const signer = this.getSigner(account) as RNGethSigner
    return signer.unlock(passphrase, duration)
  }

  isAccountUnlocked(address: string) {
    const signer = this.getSigner(address)
    return signer.isUnlocked()
  }

  /**
   * Gets the signer based on the 'from' field in the tx body
   * @param txParams Transaction to sign
   * @dev overrides WalletBase.signTransaction
   */
  async signTransaction(txParams: Tx) {
    Logger.info(`${TAG}@signTransaction`, `Signing transaction to: ${txParams.to}`)
    // Get the signer from the 'from' field
    const fromAddress = txParams.from!.toString()
    const signer = this.getSigner(fromAddress)
    return signer.signRawTransaction(txParams)
  }
}
