// Special logic for Web DApps run on mobile
import {
  AccountAuthResponseSuccess,
  parseDappkitResponseDeeplink,
  SignTxResponseSuccess,
} from '@celo/utils'
import { checkAccountAuth, checkSignedTxs } from './index'
export {
  AccountAuthRequest,
  DappKitRequestMeta,
  serializeDappKitRequestDeeplink,
  SignTxRequest,
} from '@celo/utils'
export { FeeCurrency, requestAccountAddress, requestTxSig, TxParams } from './index'

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

async function waitDecorator(
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

export async function waitForAccountAuth(requestId: string): Promise<AccountAuthResponseSuccess> {
  return waitDecorator(requestId, checkAccountAuth)
}

export async function waitForSignedTxs(requestId: string): Promise<SignTxResponseSuccess> {
  return waitDecorator(requestId, checkSignedTxs)
}
