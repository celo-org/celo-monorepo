import { LocalWallet } from '@celo/wallet-local'
import { KeystoreBase } from './keystore-base'

/**
 * Convenience wrapper of the LocalWallet to connect to a keystore
 */
export class KeystoreWalletWrapper {
  private _keystore: KeystoreBase
  private _localWallet: LocalWallet

  constructor(keystore: KeystoreBase) {
    this._keystore = keystore
    this._localWallet = new LocalWallet()
  }

  async importPrivateKey(privateKey: string, passphrase: string) {
    await this._keystore.importPrivateKey(privateKey, passphrase)
    this._localWallet.addAccount(privateKey)
  }

  getLocalWallet(): LocalWallet {
    return this._localWallet
  }

  getKeystore(): KeystoreBase {
    return this._keystore
  }

  async unlockAccount(address: string, passphrase: string) {
    // Unlock and add account to internal LocalWallet
    this._localWallet.addAccount(await this._keystore.getPrivateKey(address, passphrase))
  }

  async lockAccount(address: string) {
    this._localWallet.removeAccount(address)
  }
}

// const testKeystoreWalletWrapper = new KeystoreWalletWrapper(new FileKeystore())
