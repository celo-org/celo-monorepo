import {
  AccountAuthRequest,
  DappKitRequestMeta,
  DappKitRequestTypes,
  DappKitResponseStatus,
  parseDappkitResponseDepplink,
  serializeDappKitRequestDeeplink,
  SignTxRequest,
} from '@celo/utils'
import { CeloTokenType, GoldToken, StableToken } from '@celo/walletkit'
import { Linking } from 'expo'
import Web3 from 'web3'
import { TransactionObject } from 'web3/eth/types'

export {
  AccountAuthRequest,
  DappKitRequestMeta,
  serializeDappKitRequestDeeplink,
  SignTxRequest,
} from '@celo/utils/'

export function listenToAccount(callback: (account: string) => void) {
  return Linking.addEventListener('url', ({ url }: { url: string }) => {
    try {
      const dappKitResponse = parseDappkitResponseDepplink(url)
      if (
        dappKitResponse.type === DappKitRequestTypes.ACCOUNT_ADDRESS &&
        dappKitResponse.status === DappKitResponseStatus.SUCCESS
      ) {
        callback(dappKitResponse.address)
      }
    } catch (error) {}
  })
}

export function listenToSignedTx(callback: (signedTx: string) => void) {
  return Linking.addEventListener('url', ({ url }: { url: string }) => {
    try {
      const dappKitResponse = parseDappkitResponseDepplink(url)
      if (
        dappKitResponse.type === DappKitRequestTypes.SIGN_TX &&
        dappKitResponse.status === DappKitResponseStatus.SUCCESS
      ) {
        callback(dappKitResponse.rawTx)
      }
    } catch (error) {}
  })
}

export function requestAccountAddress(meta: DappKitRequestMeta) {
  Linking.openURL(serializeDappKitRequestDeeplink(AccountAuthRequest(meta)))
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

export async function requestTxSig<T>(web3: Web3, txParams: TxParams<T>, meta: DappKitRequestMeta) {
  const gasCurrencyContract = await getGasCurrencyContract(web3, txParams.gasCurrency)
  const estimatedTxParams = {
    gasCurrency: gasCurrencyContract.options.address,
  }
  // @ts-ignore
  const estimatedGas = await txParams.tx.estimateGas(estimatedTxParams)

  const nonce = await web3.eth.getTransactionCount(txParams.from)
  // const url = Linking.makeUrl(returnPath)

  const request = SignTxRequest(
    txParams.tx.encodeABI(),
    estimatedGas,
    txParams.from,
    txParams.to,
    nonce,
    gasCurrencyContract._address,
    meta
  )

  Linking.openURL(serializeDappKitRequestDeeplink(request))
}
