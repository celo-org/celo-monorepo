import { Address } from '@celo/contractkit'
import {
  chainIdTransformationForSigning,
  encodeTransaction,
  getHashFromEncoded,
  RLPEncodedTx,
  rlpEncodedTx,
} from '@celo/contractkit/lib/utils/signing-utils'
import { Wallet } from '@celo/contractkit/lib/utils/wallet'
import { WalletBase } from '@celo/contractkit/lib/wallets/wallet'
import {
  account as Account,
  bytes as Bytes,
  nat as Nat,
  // @ts-ignore
} from 'eth-lib'
// @ts-ignore
import * as ethUtil from 'ethereumjs-util'
import Web3 from 'web3'
import { EncodedTransaction } from 'web3-core'

export class MetamaskWallet extends WalletBase implements Wallet {
  // @ts-ignore
  web3: Web3

  constructor(provider: any) {
    super()

    if (!provider.isMetaMask) {
      throw new Error('please use a meta mask provider')
    }

    console.log('MetaMask wallet loaded.')

    this.web3 = new Web3(provider)
  }

  // @ts-ignore
  addAccount(key: string) {
    throw new Error('not implemented')
  }

  hasAccount(address?: Address): boolean {
    console.log(address)
    return true
  }

  async signPersonalMessage(address: Address, data: string): Promise<string> {
    console.log('signPersonalMessage not yet implemented', address, data)
    return ''
  }

  async signTransaction(txParams: any): Promise<EncodedTransaction> {
    console.log('signTransaction', txParams)

    const rlpEncoded: RLPEncodedTx = rlpEncodedTx(txParams)
    const addToV: number = chainIdTransformationForSigning(txParams.chainId!)
    const hash: string = getHashFromEncoded(rlpEncoded.rlpEncode)

    // Get the signer from the 'from' field
    const signature = await this.web3.eth.sign(hash, txParams.from)
    const [v, r, s] = Account.decodeSignature(signature)

    const params = [
      Nat.fromString(Bytes.fromNumber(addToV + (parseInt(v, 16) - 27))),
      Bytes.pad(32, Bytes.fromNat(r.toString(16))),
      Bytes.pad(32, Bytes.fromNat(s.toString(16))),
    ]

    const addV = Account.encodeSignature(params)

    const [v1, r1, s1] = Account.decodeSignature(addV)

    return encodeTransaction(rlpEncoded, {
      v: parseInt(v1, 16),
      r: ethUtil.toBuffer(r1) as Buffer,
      s: ethUtil.toBuffer(s1) as Buffer,
    })
  }

  getAccounts(): Address[] {
    throw new Error('not supported')
  }

  async getAccountsAsync(): Promise<Address[]> {
    return this.web3.eth.getAccounts()
  }
}
