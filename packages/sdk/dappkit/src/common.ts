import { ContractSendMethod } from '@celo/connect'
import { CeloContract, ContractKit } from '@celo/contractkit'
import {
  AccountAuthRequest,
  DappKitRequestMeta,
  DappKitRequestTypes,
  DappKitResponseStatus,
  serializeDappKitRequestDeeplink,
  SignTxRequest,
  TxToSignParam,
} from '@celo/utils'
export {
  AccountAuthRequest,
  DappKitRequestMeta,
  serializeDappKitRequestDeeplink,
  SignTxRequest,
} from '@celo/utils'

export const IOS_STORE_URL = 'https://apps.apple.com/de/app/valora-celo-payments-app/id1520414263'
export const ANDROID_STORE_URL = 'https://play.google.com/store/apps/details?id=co.clabs.valora'
export const VALORA_APP_URL = 'https://valoraapp.com/'

export function checkAccountAuth(requestId: string, dappKitResponse: any): boolean {
  return (
    requestId === dappKitResponse.requestId &&
    dappKitResponse.type === DappKitRequestTypes.ACCOUNT_ADDRESS &&
    dappKitResponse.status === DappKitResponseStatus.SUCCESS
  )
}

export function checkSignedTxs(requestId: string, dappKitResponse: any): boolean {
  return (
    requestId === dappKitResponse.requestId &&
    dappKitResponse.type === DappKitRequestTypes.SIGN_TX &&
    dappKitResponse.status === DappKitResponseStatus.SUCCESS
  )
}

export function requestAccountAddressFactory(
  meta: DappKitRequestMeta,
  openURLCallback: (url: string) => Promise<any>
) {
  openURLCallback(serializeDappKitRequestDeeplink(AccountAuthRequest(meta)))
}

export enum FeeCurrency {
  cUSD = 'cUSD',
  cGLD = 'cGLD',
}

async function getFeeCurrencyContractAddress(
  kit: ContractKit,
  feeCurrency: FeeCurrency
): Promise<string> {
  switch (feeCurrency) {
    case FeeCurrency.cUSD:
      return kit.registry.addressFor(CeloContract.StableToken)
    case FeeCurrency.cGLD:
      return kit.registry.addressFor(CeloContract.GoldToken)
    default:
      return kit.registry.addressFor(CeloContract.StableToken)
  }
}

export interface TxParams {
  tx: ContractSendMethod
  from: string
  to?: string
  feeCurrency?: FeeCurrency
  estimatedGas?: number
  value?: string
}

// Decorator to allow for separate openURL handling for dappkit/web
export async function requestTxSigFactory(
  kit: ContractKit,
  txParams: TxParams[],
  meta: DappKitRequestMeta,
  openURLCallback: (url: string) => Promise<any>
) {
  // TODO: For multi-tx payloads, we for now just assume the same from address for all txs. We should apply a better heuristic
  const baseNonce = await kit.connection.nonce(txParams[0].from)
  const txs: TxToSignParam[] = await Promise.all(
    txParams.map(async (txParam, index) => {
      const feeCurrency = txParam.feeCurrency ? txParam.feeCurrency : FeeCurrency.cGLD
      const feeCurrencyContractAddress = await getFeeCurrencyContractAddress(kit, feeCurrency)
      const value = txParam.value === undefined ? '0' : txParam.value

      const estimatedTxParams = {
        feeCurrency: feeCurrencyContractAddress,
        from: txParam.from,
        value,
      } as any
      const estimatedGas =
        txParam.estimatedGas === undefined
          ? await txParam.tx.estimateGas(estimatedTxParams)
          : txParam.estimatedGas

      return {
        txData: txParam.tx.encodeABI(),
        estimatedGas,
        nonce: baseNonce + index,
        feeCurrencyAddress: feeCurrencyContractAddress,
        value,
        ...txParam,
      }
    })
  )
  const request = SignTxRequest(txs, meta)

  openURLCallback(serializeDappKitRequestDeeplink(request))
}
