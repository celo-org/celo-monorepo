import {
  AccountAuthRequest,
  DappKitRequestMeta,
  DappKitRequestTypes,
  DappKitResponse,
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

export function waitForSignedTxs(): Promise<DappKitResponse> {
  return new Promise((resolve, reject) => {
    Linking.addEventListener('url', ({ url }: { url: string }) => {
      try {
        const dappKitResponse = parseDappkitResponseDepplink(url)
        if (
          dappKitResponse.type === DappKitRequestTypes.SIGN_TX &&
          dappKitResponse.status === DappKitResponseStatus.SUCCESS
        ) {
          resolve(dappKitResponse)
        }
      } catch (error) {
        reject(error)
      }
    })
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
  tx: TransactionObject<T>
  from: string
  to: string
  gasCurrency: GasCurrency
  estimatedGas?: number
}

export async function requestTxSig<T>(
  web3: Web3,
  txParams: TxParams<T>[],
  meta: DappKitRequestMeta
) {
  // TODO: For multi-tx payloads, we for now just assume the same from address for all txs. We should apply a better heuristic
  const baseNonce = await web3.eth.getTransactionCount(txParams[0].from)
  const txs: TxToSignParam[] = await Promise.all(
    txParams.map(async (txParam, index) => {
      const gasCurrencyContract = await getGasCurrencyContract(web3, txParam.gasCurrency)
      const estimatedTxParams = {
        gasCurrency: gasCurrencyContract.options.address,
      }
      const estimatedGas =
        txParam.estimatedGas === undefined
          ? //
            // @ts-ignore
            await txParam.tx.estimateGas(estimatedTxParams)
          : txParam.estimatedGas

      return {
        txData: txParam.tx.encodeABI(),
        estimatedGas,
        nonce: baseNonce + index,
        gasCurrencyAddress: gasCurrencyContract._address,
        ...txParam,
      }
    })
  )

  // const url = Linking.makeUrl(returnPath)

  const request = SignTxRequest(txs, meta)

  Linking.openURL(serializeDappKitRequestDeeplink(request))
}
