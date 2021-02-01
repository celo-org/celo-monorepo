import { Address, normalizeAddressWith0x, privateKeyToAddress } from '@celo/utils/lib/address'
import { Wallet, WalletBase } from '@celo/wallet-base'
import { LocalSigner } from './local-signer'

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
