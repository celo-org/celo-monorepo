import {
  ensureLeading0x,
  normalizeAddressWith0x,
  privateKeyToAddress,
} from '@celo/utils/lib/address'
import { EncodedTransaction, provider, Tx } from 'web3-core'
import { DefaultRpcCaller, RpcCaller } from '../utils/rpc-caller'
import { encodeTransaction, rlpEncodedTx } from '../utils/signing-utils'
import { RemoteWallet } from './remote-wallet'
import { RpcSigner } from './signers/rpc-signer'
import { Signer } from './signers/signer'

/*
 *   WARNING: This class should only be used with well-permissioned providers (ie IPC)
 *   to avoid sensitive user 'privateKey' and 'passphrase' information being exposed
 */
export class RpcWallet extends RemoteWallet {
  protected readonly rpc: RpcCaller

  constructor(protected _provider: provider) {
    super()
    this.rpc = new DefaultRpcCaller(_provider)
  }

  async loadAccountSigners(): Promise<Map<string, Signer>> {
    const addressToSigner = new Map<string, Signer>()
    const resp = await this.rpc.call('eth_accounts', [])
    if (resp.error) {
      throw new Error(`RpcWallet: failed to fetch accounts from server`)
    }
    const accounts: string[] = resp.result!
    accounts.forEach((account) => {
      addressToSigner.set(account, new RpcSigner(this.rpc, account))
    })
    return addressToSigner
  }

  async addAccount(privateKey: string, passphrase: string): Promise<string> {
    const formattedPrivateKey = ensureLeading0x(privateKey)
    const address = normalizeAddressWith0x(privateKeyToAddress(formattedPrivateKey))
    if (this.hasAccount(address)) {
      throw new Error(`RpcWallet: account already exists`)
    }
    const signer = new RpcSigner(this.rpc, address)
    const resp = await signer.init(formattedPrivateKey, passphrase)
    if (resp.error) {
      throw new Error(`RpcWallet: signer init failed with ${resp.error}`)
    }
    this.addSigner(resp.result!, signer)
    return resp.result!
  }

  async unlockAccount(address: string, passphrase: string, duration: number) {
    const signer = this.getSigner(address) as RpcSigner
    return signer.unlock(passphrase, duration)
  }

  isAccountUnlocked(address: string) {
    const signer = this.getSigner(address) as RpcSigner
    return signer.isUnlocked()
  }

  /**
   * Gets the signer based on the 'from' field in the tx body
   * @param txParams Transaction to sign
   * @dev overrides WalletBase.signTransaction
   */
  async signTransaction(txParams: Tx): Promise<EncodedTransaction> {
    const rlpEncoded = rlpEncodedTx(txParams)
    // Get the signer from the 'from' field
    const fromAddress = txParams.from!.toString()
    const signer = this.getSigner(fromAddress) as RpcSigner
    // addToV set to 0 because geth RPC performs EIP155 replay prevention by default
    // see: https://github.com/celo-org/celo-blockchain/blob/master/core/types/transaction_signing.go#L148
    const signature = await signer.signTransaction(0, rlpEncoded)
    return encodeTransaction(rlpEncoded, signature)
  }
}
