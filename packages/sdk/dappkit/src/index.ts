import { ContractSendMethod } from '@celo/connect'
import { CeloContract, ContractKit } from '@celo/contractkit'
import {
  AccountAuthRequest,
  AccountAuthResponseSuccess,
  DappKitRequestMeta,
  DappKitRequestTypes,
  DappKitResponseStatus,
  parseDappkitResponseDeeplink,
  serializeDappKitRequestDeeplink,
  SignTxRequest,
  SignTxResponseSuccess,
  TxToSignParam,
} from '@celo/utils'
import { Linking } from 'react-native'
export {
  AccountAuthRequest,
  DappKitRequestMeta,
  serializeDappKitRequestDeeplink,
  SignTxRequest,
} from '@celo/utils'

// DappKit Web constants and helpers
const localStorageKey = 'dappkit-web'
// hack to get around dappkit issue where new tabs are opened
// and the url hash state is not respected (Note this implementation
// of dappkit doesn't use URL hashes to always force the newtab experience).

// Function that should be called within dapp wherever a window is rendered
export function parseURLOnRender() {
  if (typeof window !== 'undefined') {
    const params = new URL(window.location.href).searchParams
    if (params.get('type') && params.get('requestId')) {
      localStorage.setItem(localStorageKey, window.location.href)
      // TODO: seems like the below line is not getting executed in Chrome on iOS
      // on iOS though, the newly opened window gets closed and the following window (instead of the previously opened tab) gets opened
      window.close()
    }
  }
}

async function waitForResponse() {
  while (true) {
    const value = localStorage.getItem(localStorageKey)
    if (value) {
      localStorage.removeItem(localStorageKey)
      return value
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}

export function listenToAccount(callback: (account: string) => void) {
  return Linking.addEventListener('url', ({ url }: { url: string }) => {
    try {
      const dappKitResponse = parseDappkitResponseDeeplink(url)
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
      const dappKitResponse = parseDappkitResponseDeeplink(url)
      if (
        dappKitResponse.type === DappKitRequestTypes.SIGN_TX &&
        dappKitResponse.status === DappKitResponseStatus.SUCCESS
      ) {
        callback(dappKitResponse.rawTxs)
      }
    } catch (error) {}
  })
}

function waitDecoratorMobile(
  requestId: string,
  checkCallback: (requestId: string, dappKitResponse: any) => boolean
): Promise<any> {
  return new Promise((resolve, reject) => {
    const handler = ({ url }: { url: string }) => {
      try {
        const dappKitResponse = parseDappkitResponseDeeplink(url)
        if (checkCallback(requestId, dappKitResponse)) {
          Linking.removeEventListener('url', handler)
          resolve(dappKitResponse)
        }
      } catch (error) {
        reject(error)
      }
    }
    Linking.addEventListener('url', handler)
  })
}

async function waitDecoratorWeb(
  requestId: string,
  checkCallback: (requestId: string, dappKitResponse: any) => boolean
): Promise<any> {
  const url = await waitForResponse()
  const dappKitResponse = parseDappkitResponseDeeplink(url)
  if (checkCallback(requestId, dappKitResponse)) {
    return dappKitResponse
  }
  console.log('Unable to parse url', url)
  throw new Error('Unable to parse Valora response')
}

function checkAccountAuth(requestId: string, dappKitResponse: any): boolean {
  return (
    requestId === dappKitResponse.requestId &&
    dappKitResponse.type === DappKitRequestTypes.ACCOUNT_ADDRESS &&
    dappKitResponse.status === DappKitResponseStatus.SUCCESS
  )
}

function checkSignedTxs(requestId: string, dappKitResponse: any): boolean {
  return (
    requestId === dappKitResponse.requestId &&
    dappKitResponse.type === DappKitRequestTypes.SIGN_TX &&
    dappKitResponse.status === DappKitResponseStatus.SUCCESS
  )
}

// For usage in Mobile DApps
export function waitForAccountAuth(requestId: string): Promise<AccountAuthResponseSuccess> {
  return waitDecoratorMobile(requestId, checkAccountAuth)
}

export function waitForSignedTxs(requestId: string): Promise<SignTxResponseSuccess> {
  return waitDecoratorMobile(requestId, checkSignedTxs)
}

// For usage in Web DApps
export async function waitForAccountAuthWeb(
  requestId: string
): Promise<AccountAuthResponseSuccess> {
  return waitDecoratorWeb(requestId, checkAccountAuth)
}

export async function waitForSignedTxsWeb(requestId: string): Promise<SignTxResponseSuccess> {
  return waitDecoratorWeb(requestId, checkSignedTxs)
}

export function requestAccountAddress(meta: DappKitRequestMeta) {
  Linking.openURL(serializeDappKitRequestDeeplink(AccountAuthRequest(meta)))
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

export async function requestTxSig(
  kit: ContractKit,
  txParams: TxParams[],
  meta: DappKitRequestMeta
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

  Linking.openURL(serializeDappKitRequestDeeplink(request))
}
