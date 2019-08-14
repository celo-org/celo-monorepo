import { StableToken } from '@celo/walletkit'
import { StableToken as StableTokenType } from '@celo/walletkit/lib/types/StableToken'
import {
  awaitConfirmation,
  emptyTxLogger,
  sendTransactionAsync,
} from '@celo/walletkit/src/contract-utils'
import Web3 from 'web3'
import { TransactionObject } from 'web3/eth/types'

let stableToken: StableTokenType
let web3: Web3
let account: string

export async function sendTransaction(tx: TransactionObject<any>) {
  if (!web3) {
    web3 = new Web3('http://localhost:8545')
    account = (await web3.eth.getAccounts())[0]
  }

  if (!stableToken) {
    stableToken = await StableToken(web3)
  }

  return sendTransactionAsync(tx, account, stableToken, emptyTxLogger).then(awaitConfirmation)
}
