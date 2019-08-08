import { CeloTokenType, GoldToken, StableToken } from '@celo/contractkit'
import { AccountAuthRequest, serializeDappKitRequestDeeplink, SignTxRequest } from '@celo/utils'
import { Linking } from 'expo'
import Web3 from 'web3'
import { TransactionObject } from 'web3/eth/types'

export { AccountAuthRequest, serializeDappKitRequestDeeplink, SignTxRequest } from '@celo/utils'

export function listenToAccount(callback: (account: string) => void) {
  return Linking.addEventListener('url', ({ url }: { url: string }) => {
    const { queryParams } = Linking.parse(url)
    if (queryParams.account) {
      callback(queryParams.account)
    }
  })
}

export function listenToSignedTx(callback: (signedTx: string) => void) {
  return Linking.addEventListener('url', ({ url }: { url: string }) => {
    const { queryParams } = Linking.parse(url)
    if (queryParams.rawTx) {
      callback(queryParams.rawTx)
    }
  })
}

export function requestAccountAddress(returnPath: string) {
  const url = Linking.makeUrl(returnPath)
  Linking.openURL(serializeDappKitRequestDeeplink(AccountAuthRequest(url, 'test')))
}

export enum GasCurrency {
  cUSD = 'cUSD',
  cGLD = 'cGLD',
}

async function getGasCurrencyContract(
  web3: Web3,
  gasCurrency: GasCurrency
): Promise<CeloTokenType> {
  switch (gasCurrency) {
    case GasCurrency.cUSD:
      return StableToken(web3)
    case GasCurrency.cGLD:
      return GoldToken(web3)
    default:
      return StableToken(web3)
  }
}

export interface TxParams<T> {
  txId: string
  tx: TransactionObject<T>
  from: string
  to: string
  gasCurrency: GasCurrency
}

export async function requestTxSig<T>(web3: Web3, txParams: TxParams<T>, returnPath: string) {
  const gasCurrencyContract = await getGasCurrencyContract(web3, txParams.gasCurrency)
  const estimatedTxParams = { gasCurrency: gasCurrencyContract._address }
  // @ts-ignore
  const estimatedGas = await txParams.tx.estimateGas(estimatedTxParams)

  const nonce = await web3.eth.getTransactionCount(txParams.from)
  const url = Linking.makeUrl(returnPath)

  const request = SignTxRequest(
    txParams.tx.encodeABI(),
    estimatedGas,
    txParams.from,
    txParams.to,
    nonce,
    gasCurrencyContract._address,
    url,
    'test'
  )

  Linking.openURL(serializeDappKitRequestDeeplink(request))
}
