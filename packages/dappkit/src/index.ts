import {
  AccountAuthRequest,
  DappKitRequestMeta,
  DappKitRequestTypes,
  DappKitResponseStatus,
  parseDappkitResponseDepplink,
  serializeDappKitRequestDeeplink,
  SignTxRequest,
  TxToSignParam,
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

export function listenToSignedTxs(callback: (signedTxs: string[]) => void) {
  return Linking.addEventListener('url', ({ url }: { url: string }) => {
    try {
      const dappKitResponse = parseDappkitResponseDepplink(url)
      if (
        dappKitResponse.type === DappKitRequestTypes.SIGN_TX &&
        dappKitResponse.status === DappKitResponseStatus.SUCCESS
      ) {
        callback(dappKitResponse.rawTxs)
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

export async function requestTxSig<T>(
  web3: Web3,
  txParams: TxParams<T>[],
  meta: DappKitRequestMeta
) {
  const txs: TxToSignParam[] = await Promise.all(
    txParams.map(async (txParam) => {
      const gasCurrencyContract = await getGasCurrencyContract(web3, txParam.gasCurrency)
      const estimatedTxParams = {
        gasCurrency: gasCurrencyContract.options.address,
      }
      // @ts-ignore
      const estimatedGas = await txParam.tx.estimateGas(estimatedTxParams)

      const nonce = await web3.eth.getTransactionCount(txParam.from)
      return {
        txData: txParam.tx.encodeABI(),
        estimatedGas,
        nonce,
        gasCurrencyAddress: gasCurrencyContract._address,
        ...txParam,
      }
    })
  )

  // const url = Linking.makeUrl(returnPath)

  const request = SignTxRequest(txs, meta)

  Linking.openURL(serializeDappKitRequestDeeplink(request))
}
