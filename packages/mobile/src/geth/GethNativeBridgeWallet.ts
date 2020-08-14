import { RemoteWallet } from '@celo/contractkit/lib/wallets/remote-wallet'
import { WritableWallet } from '@celo/contractkit/lib/wallets/wallet'
import {
  ensureLeading0x,
  normalizeAddressWith0x,
  privateKeyToAddress,
} from '@celo/utils/lib/address'
import RNGeth from 'react-native-geth'
import { GethNativeBridgeSigner } from 'src/geth/GethNativeBridgeSigner'
import Logger from 'src/utils/Logger'
import { Tx } from 'web3-core'

export enum GethNativeBridgeWalletErrors {
  FetchAccounts = 'GethNativeBridgeWallet: failed to fetch accounts from geth wrapper',
  AccountAlreadyExists = 'GethNativeBridgeWallet: account already exists',
  UnexpectedAddressOnAdd = 'GethNativeBridgeWallet: unexpected address returned from addAccount',
}

const TAG = 'geth/GethNativeBridgeWallet'

export class GethNativeBridgeWallet extends RemoteWallet<GethNativeBridgeSigner>
  implements WritableWallet {
  /**
   * Construct a React Native geth wallet which uses the bridge methods
   * instead of communicating with a node
   * @param geth The instance of the bridge object
   * @dev overrides WalletBase.signTransaction
   */
  constructor(private geth: RNGeth) {
    super()
  }

  async loadAccountSigners(): Promise<Map<string, GethNativeBridgeSigner>> {
    let accounts: string[]
    const addressToSigner = new Map<string, GethNativeBridgeSigner>()

    try {
      accounts = await this.geth.listAccounts()
    } catch (e) {
      Logger.error(`${TAG}@loadAccountSigners`, e.toString())
      throw new Error(GethNativeBridgeWalletErrors.FetchAccounts)
    }

    accounts.forEach((address) => {
      const cleanAddress = normalizeAddressWith0x(address)
      addressToSigner.set(cleanAddress, new GethNativeBridgeSigner(this.geth, cleanAddress))
    })
    return addressToSigner
  }

  async addAccount(privateKey: string, passphrase: string): Promise<string> {
    Logger.info(`${TAG}@addAccount`, `Adding a new account`)
    const address = normalizeAddressWith0x(privateKeyToAddress(ensureLeading0x(privateKey)))
    if (this.hasAccount(address)) {
      throw new Error(GethNativeBridgeWalletErrors.AccountAlreadyExists)
    }
    const signer = new GethNativeBridgeSigner(this.geth, address)
    const resultantAddress = await signer.init(privateKey, passphrase)
    if (normalizeAddressWith0x(resultantAddress) !== address) {
      throw new Error(GethNativeBridgeWalletErrors.UnexpectedAddressOnAdd)
    }
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
    const signer = this.getSigner(account) as GethNativeBridgeSigner
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
