import { normalizeAddressWith0x, privateKeyToAddress } from '@celo/utils/lib/address'
import { provider } from 'web3-core'
import { DefaultRpcCaller, RpcCaller } from '../utils/rpc-caller'
import { GethSigner } from './signers/geth-signer'
import { Wallet, WalletBase } from './wallet'

export class GethWallet extends WalletBase implements Wallet {
  protected gethSigner: GethSigner
  protected gethRpcCaller: RpcCaller
  constructor(protected gethProvider: provider) {
    super()
    this.gethRpcCaller = new DefaultRpcCaller(gethProvider)
    this.gethSigner = new GethSigner(this.gethRpcCaller)
  }

  async addAccount(privateKey: string, passphrase: string) {
    // Prefix 0x here or else the signed transaction produces dramatically different signer!!!
    privateKey = normalizeAddressWith0x(privateKey)
    const accountAddress = normalizeAddressWith0x(privateKeyToAddress(privateKey))
    if (this.hasAccount(accountAddress)) {
      return
    }
    await this.gethRpcCaller.call('personal_importRawKey', [privateKey, passphrase])
    this.addSigner(accountAddress, this.gethSigner)
  }

  async unlockAccount(address: string, passphrase: string, duration: number) {
    await this.gethRpcCaller.call('personal_unlockAccount', [address, passphrase, duration])
  }
}
