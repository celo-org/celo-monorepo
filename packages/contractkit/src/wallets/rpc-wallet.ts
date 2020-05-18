import {
  ensureLeading0x,
  normalizeAddressWith0x,
  privateKeyToAddress,
} from '@celo/utils/lib/address'
import { provider } from 'web3-core'
import { DefaultRpcCaller, RpcCaller } from '../utils/rpc-caller'
import { RemoteWallet } from './remote-wallet'
import { RpcSigner } from './signers/rpc-signer'
import { Signer } from './signers/signer'

export class RpcWallet extends RemoteWallet {
  public readonly rpc: RpcCaller

  constructor(protected _provider: provider) {
    super()
    this.rpc = new DefaultRpcCaller(_provider)
  }

  protected async loadAccountSigners(): Promise<Map<string, Signer>> {
    const resp = await this.rpc.call('eth_accounts', [])
    const accounts: string[] = resp.result!
    const signerMap = new Map()
    accounts.forEach((account) => {
      account = normalizeAddressWith0x(account)
      signerMap.set(account, new RpcSigner(this.rpc, account))
    })
    return signerMap
  }

  async addAccount(privateKey: string, passphrase: string): Promise<string> {
    privateKey = ensureLeading0x(privateKey)
    const address = privateKeyToAddress(privateKey)
    if (this.hasAccount(address)) {
      throw new Error(`RpcWallet: account ${address} already exists`)
    }
    const signer = new RpcSigner(this.rpc, address)
    const resp = await signer.init(privateKey, passphrase)
    this.addSigner(resp.result!, signer)
    return resp.result!
  }

  async unlockAccount(address: string, passphrase: string, duration: number) {
    address = normalizeAddressWith0x(address)
    if (!this.hasAccount(address)) {
      throw new Error(`RpcWallet: account ${address} does not exist`)
    }
    const signer = this.accountSigners.get(address)! as RpcSigner
    return signer.unlock(passphrase, duration)
  }

  isAccountUnlocked(address: string) {
    address = normalizeAddressWith0x(address)
    if (!this.hasAccount(address)) {
      throw new Error(`RpcWallet: account ${address} does not exist`)
    }
    const signer = this.accountSigners.get(address)! as RpcSigner
    return signer.isUnlocked()
  }
}
