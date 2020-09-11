import { ensureLeading0x, normalizeAddressWith0x } from '@celo/base/lib/address'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import { provider, Tx } from 'web3-core'
import { DefaultRpcCaller, RpcCaller } from '../utils/rpc-caller'
import { RemoteWallet } from './remote-wallet'
import { RpcSigner } from './signers/rpc-signer'
import { UnlockableWallet } from './wallet'

export enum RpcWalletErrors {
  FetchAccounts = 'RpcWallet: failed to fetch accounts from server',
  AccountAlreadyExists = 'RpcWallet: account already exists',
}

/*
 *   WARNING: This class should only be used with well-permissioned providers (ie IPC)
 *   to avoid sensitive user 'privateKey' and 'passphrase' information being exposed
 */
export class RpcWallet extends RemoteWallet<RpcSigner> implements UnlockableWallet {
  protected readonly rpc: RpcCaller

  constructor(protected _provider: provider) {
    super()
    this.rpc = new DefaultRpcCaller(_provider)
  }

  async loadAccountSigners(): Promise<Map<string, RpcSigner>> {
    const addressToSigner = new Map<string, RpcSigner>()
    const resp = await this.rpc.call('eth_accounts', [])
    if (resp.error) {
      throw new Error(RpcWalletErrors.FetchAccounts)
    }
    const accounts: string[] = resp.result!
    accounts.forEach((account) => {
      addressToSigner.set(account, new RpcSigner(this.rpc, account))
    })
    return addressToSigner
  }

  async addAccount(privateKey: string, passphrase: string): Promise<string> {
    const address = normalizeAddressWith0x(privateKeyToAddress(ensureLeading0x(privateKey)))
    if (this.hasAccount(address)) {
      throw new Error(RpcWalletErrors.AccountAlreadyExists)
    }
    const signer = new RpcSigner(this.rpc, address)
    const resultantAddress = await signer.init(privateKey, passphrase)
    this.addSigner(resultantAddress, signer)
    return resultantAddress
  }

  async unlockAccount(address: string, passphrase: string, duration: number) {
    const signer = this.getSigner(address)
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
    // Get the signer from the 'from' field
    const fromAddress = txParams.from!.toString()
    const signer = this.getSigner(fromAddress)
    return signer.signRawTransaction(txParams)
  }
}
