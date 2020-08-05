import { Wallet, WalletBase } from '@celo/contractkit/lib/wallets/wallet'
import { Tx } from 'web3-core'
// import RNGeth from 'react-native-geth'
import {
  encodeTransaction,
  extractSignature,
  rlpEncodedTx,
} from '@celo/contractkit/lib/utils/signing-utils'

export class RNGethWallet extends WalletBase implements Wallet {
  /**
   * Construct a React Native geth wallet which uses the bridge methods
   * instead of communicating with a node
   * @param geth The instance of the bridge object
   * @dev overrides WalletBase.signTransaction
   * TODO: Solve any
   */
  constructor(private geth: any) {
    super()
  }

  /**
   * Gets the signer based on the 'from' field in the tx body
   * @param txParams Transaction to sign
   * @dev overrides WalletBase.signTransaction
   */
  async signTransaction(txParams: Tx) {
    // Get the signer from the 'from' field
    const fromAddress = txParams.from!.toString()
    const encoded = rlpEncodedTx(txParams)
    const signedTxRLP = await this.geth.signTransaction(encoded.rlpEncode, fromAddress)
    return await encodeTransaction(encoded, extractSignature(signedTxRLP))
  }
}
