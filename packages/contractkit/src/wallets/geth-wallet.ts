import { ensureLeading0x, privateKeyToAddress } from '@celo/utils/lib/address'
// @ts-ignore-next-line
import { account as Account } from 'eth-lib'
import * as ethUtil from 'ethereumjs-util'
import { EncodedTransaction, provider, Tx } from 'web3-core'
import { DefaultRpcCaller, RpcCaller } from '../utils/rpc-caller'
import { EIP712TypedData } from '../utils/sign-typed-data-utils'
import { encodeTransaction, rlpEncodedTx } from '../utils/signing-utils'
import { Wallet } from './wallet'

enum GethRpc {
  signTransaction = 'eth_signTransaction',
  signTypedData = 'eth_signTypedData',
  signPersonal = 'personal_sign',
  unlockPersonal = 'personal_unlockAccount',
  addPersonal = 'personal_importRawKey',
}

const currentTimeInSeconds = () => Math.round(Date.now() / 1000)

export class GethWallet implements Wallet {
  protected rpc: RpcCaller
  private accounts: Map<string, { unlockedAt: number; duration: number }>

  constructor(protected gethProvider: provider) {
    this.rpc = new DefaultRpcCaller(gethProvider)
    this.accounts = new Map()
  }

  getAccounts = () => Array.from(this.accounts.keys())
  hasAccount = (address?: string) => this.accounts.has(address!)

  async addAccount(privateKey: string, passphrase: string): Promise<string> {
    privateKey = ensureLeading0x(privateKey)
    const address = privateKeyToAddress(privateKey)
    if (this.hasAccount(address)) {
      throw new Error(`GethWallet already has address ${address}`)
    }
    await this.callRpc(GethRpc.addPersonal, [privateKey, passphrase], address)
    this.accounts.set(address, { unlockedAt: -1, duration: -1 })
    return address
  }

  async unlockAccount(address: string, passphrase: string, duration: number) {
    this.requireHasAccount(address)
    await this.callRpc(GethRpc.unlockPersonal, [address, passphrase, duration], true)
    this.accounts.set(address, { unlockedAt: currentTimeInSeconds(), duration })
  }

  isAccountUnlocked(address: string) {
    this.requireHasAccount(address)
    const unlockedInfo = this.accounts.get(address)!
    return unlockedInfo.unlockedAt + unlockedInfo.duration > currentTimeInSeconds()
  }

  async signTransaction(txParams: Tx): Promise<EncodedTransaction> {
    const address = txParams.from! as string
    this.requireAccountUnlocked(address)
    const rlpEncoded = rlpEncodedTx(txParams)
    const result = await this.callRpc(GethRpc.signTransaction, [txParams])
    const signature = decodeSig(result)
    return encodeTransaction(rlpEncoded, signature)
  }

  async signPersonalMessage(address: string, data: string): Promise<string> {
    this.requireAccountUnlocked(address)
    return this.callRpc(GethRpc.signPersonal, [data, address])
  }

  async signTypedData(address: string, typedData: EIP712TypedData): Promise<string> {
    this.requireAccountUnlocked(address)
    return this.callRpc(GethRpc.signTypedData, [typedData, address])
  }

  private async callRpc(method: GethRpc, params: any[], expectedResp?: any) {
    const resp = await this.rpc.call(method.toString(), params)
    if (resp.error) {
      throw new Error(`GethWallet: Error ${resp.error} during ${method.toString()}`)
    } else if (expectedResp && expectedResp !== resp.result) {
      throw new Error(`GethWallet: ${method.toString()} gave unexpected result ${resp.result}`)
    }
    return resp.result!
  }

  private requireHasAccount(address: string) {
    if (!this.hasAccount(address)) {
      throw new Error(`GethWallet does not have address ${address}`)
    }
  }

  private requireAccountUnlocked(address: string) {
    if (!this.isAccountUnlocked(address)) {
      throw new Error(`GethWallet address ${address} is not unlocked`)
    }
  }
}

const decodeSig = (sig: any) => {
  const [v, r, s] = Account.decodeSignature(sig)
  return {
    v: parseInt(v, 16),
    r: ethUtil.toBuffer(r) as Buffer,
    s: ethUtil.toBuffer(s) as Buffer,
  }
}
