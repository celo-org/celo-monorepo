// Special logic for Web DApps run on mobile
import { ContractKit } from '@celo/contractkit'
import {
  AccountAuthResponseSuccess,
  DappKitRequestMeta,
  parseDappkitResponseDeeplink,
  SignTxResponseSuccess,
} from '@celo/utils'
import {
  checkAccountAuth,
  checkSignedTxs,
  requestAccountAddressFactory,
  requestTxSigFactory,
  TxParams,
} from './common'
export {
  AccountAuthRequest,
  DappKitRequestMeta,
  serializeDappKitRequestDeeplink,
  SignTxRequest,
} from '@celo/utils'
// TODO: causes warnings for webpack/babel/expo, once prettier is upgraded use:
// export type { TxParams } from './common'
export { FeeCurrency, TxParams } from './common'

// DappKit Web constants and helpers
const localStorageKey = 'dappkit-web'

// Ensure this is called on dappkit import
parseURLOnRender()

// hack to get around dappkit issue where new tabs are opened
// and the url hash state is not respected (Note this implementation
// of dappkit doesn't use URL hashes to always force the newtab experience).

// Function that should be called within dapp wherever a window is rendered
export function parseURLOnRender() {
  if (typeof window !== 'undefined') {
    const params = new URL(window.location.href).searchParams
    if (params.get('type') && params.get('requestId')) {
      // Prevents error when reloading a chrome page with params in the URL
      if (localStorage) {
        localStorage.setItem(localStorageKey, window.location.href)
        // TODO: seems like the below line is not getting executed in Chrome on iOS
        // on iOS though, the newly opened window gets closed and the following window (instead of the previously opened tab) gets opened
        window.close()
      }
    }
  }
}

async function waitForResponse(timeout: number) {
  // In milliseconds
  const pollInterval = 100
  const endTime = Date.now() + timeout

  while (Date.now() < endTime) {
    const value = localStorage.getItem(localStorageKey)
    if (value) {
      localStorage.removeItem(localStorageKey)
      return value
    }
    await new Promise((resolve) => setTimeout(resolve, pollInterval))
  }
  throw new Error('Timeout waiting for Valora response')
}

async function waitDecorator(
  requestId: string,
  checkCallback: (requestId: string, dappKitResponse: any) => boolean,
  timeout: number = 15000
): Promise<any> {
  const url = await waitForResponse(timeout)
  const dappKitResponse = parseDappkitResponseDeeplink(url)
  if (checkCallback(requestId, dappKitResponse)) {
    return dappKitResponse
  }
  throw new Error('Unable to parse Valora response')
}

export async function waitForAccountAuth(requestId: string): Promise<AccountAuthResponseSuccess> {
  return waitDecorator(requestId, checkAccountAuth)
}

export async function waitForSignedTxs(requestId: string): Promise<SignTxResponseSuccess> {
  return waitDecorator(requestId, checkSignedTxs)
}

export async function requestAccountAddress(meta: DappKitRequestMeta) {
  return requestAccountAddressFactory(meta, openURL)
}

export async function requestTxSig(
  kit: ContractKit,
  txParams: TxParams[],
  meta: DappKitRequestMeta
) {
  return requestTxSigFactory(kit, txParams, meta, openURL)
}

async function openURL(url: string) {
  window.location.href = url
}
