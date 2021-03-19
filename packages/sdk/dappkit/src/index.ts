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
import { Linking, Platform } from 'react-native'
export {
  AccountAuthRequest,
  DappKitRequestMeta,
  serializeDappKitRequestDeeplink,
  SignTxRequest,
} from '@celo/utils'

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

function waitDecorator(
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

export function waitForAccountAuth(requestId: string): Promise<AccountAuthResponseSuccess> {
  return waitDecorator(requestId, checkAccountAuth)
}

export function waitForSignedTxs(requestId: string): Promise<SignTxResponseSuccess> {
  return waitDecorator(requestId, checkSignedTxs)
}

export function requestAccountAddress(meta: DappKitRequestMeta) {
  // Linking.openURL(serializeDappKitRequestDeeplink(AccountAuthRequest(meta)))
  openURLOrAppStore(serializeDappKitRequestDeeplink(AccountAuthRequest(meta)))
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

  // Linking.openURL(serializeDappKitRequestDeeplink(request))
  openURLOrAppStore(serializeDappKitRequestDeeplink(request))
}

// TODO: wrapper for Linking.openURL that checks if Valora exists and if not prompts redirect to the app store
// potentially then retry flow? --> look into this as step two
// TODO: look out for Valora vs. Alfajores test wallet handling --> check that the proper one is being opened?
// TODO get this working with expo as well...

// Function to wrap Linking.openURL to try to redirect to App Store if app isn't downloaded
async function openURLOrAppStore(url: string) {
  let callURL
  if (await Linking.canOpenURL(url)) {
    callURL = url
  } else {
    switch (Platform.OS) {
      case 'ios': {
        callURL = 'https://apps.apple.com/de/app/valora-celo-payments-app/id1520414263'
        break
      }
      case 'android': {
        callURL = 'https://play.google.com/store/apps/details?id=co.clabs.valora'
        break
      }
      default: {
        callURL = 'https://valoraapp.com/'
        break
      }
    }
  }
  await Linking.openURL(callURL)

  // let ua = navigator.userAgent.toLowerCase()
  // let isAndroid = ua.indexOf('android') > -1 // android check
  // let isIphone = ua.indexOf('iphone') > -1 // ios check

  // if (isIphone == true) {
  //   // let app = {
  //   //   launchApp: function() {
  //   //     setTimeout(function() {
  //   //       window.location.href = 'https://itunes.apple.com/us/app/appname/appid'
  //   //     }, 25)
  //   //     window.location.href = url //which page to open(now from mobile, check its authorization)
  //   //   },
  //   //   openWebApp: function() {
  //   //     window.location.href = 'https://itunes.apple.com/us/app/appname/appid'
  //   //   },
  //   // }
  //   // app.launchApp()
  //   console.log("Hello I'm an iPhone")
  // } else if (isAndroid == true) {
  //   // let app = {
  //   //   launchApp: function () {
  //   //     window.open(url);
  //   //   },
  //   //   // openWebApp: function () {
  //   //   //   window.location.href =
  //   //   //     'https://play.google.com/store/apps/details?id=packagename';
  //   //   // },
  //   // };
  //   // app.launchApp();
  //   console.log("Hello I'm an Android")
  // } else {
  //   //navigate to website url
  // }
  // return
}
