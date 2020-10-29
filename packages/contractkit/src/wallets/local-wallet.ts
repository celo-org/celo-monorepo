import { normalizeAddressWith0x, privateKeyToAddress } from '@celo/utils/lib/address'
import { Address } from '../base'
import { LocalSigner } from './signers/local-signer'
import { Wallet, WalletBase } from './wallet'

export class LocalWallet extends WalletBase<LocalSigner> implements Wallet {
  /**
   * Register the private key as signer account
   * @param privateKey account private key
   */
  addAccount(privateKey: string): void {
    // Prefix 0x here or else the signed transaction produces dramatically different signer!!!
    privateKey = normalizeAddressWith0x(privateKey)
    const accountAddress = normalizeAddressWith0x(privateKeyToAddress(privateKey))
    if (this.hasAccount(accountAddress)) {
      return
    }
    this.addSigner(accountAddress, new LocalSigner(privateKey))
  }

  /**
   * Remove the account
   * @param address Adddress of the account to remove
   */
  removeAccount(address: Address) {
    this.removeSigner(address)
  }
}
