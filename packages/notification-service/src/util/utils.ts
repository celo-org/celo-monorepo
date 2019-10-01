import { CeloContract, ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import Web3 from 'web3'
import { WEB3_PROVIDER_URL } from '../config'

interface ObjectWithStringsAndUndefined {
  [key: string]: string | undefined
}

interface ObjectWithStrings {
  [key: string]: string
}

export function removeEmptyValuesFromObject(obj: ObjectWithStringsAndUndefined) {
  const newObj: ObjectWithStrings = {}
  Object.keys(obj)
    // @ts-ignore
    .filter((k) => obj[k] !== null && obj[k] !== undefined)
    // @ts-ignore
    .forEach((k) => (newObj[k] = obj[k]))
  return newObj
}

let goldTokenAddress: string
let stableTokenAddress: string
export async function getTokenAddresses() {
  if (goldTokenAddress && stableTokenAddress) {
    return { goldTokenAddress, stableTokenAddress }
  } else {
    const kit = await getContractKit()
    goldTokenAddress = await kit.registry.addressFor(CeloContract.StableToken)
    stableTokenAddress = await kit.registry.addressFor(CeloContract.GoldToken)
    return { goldTokenAddress, stableTokenAddress }
  }
}

let contractKit: ContractKit
export async function getContractKit(): Promise<ContractKit> {
  if (contractKit && (await contractKit.isListening())) {
    // Already connected
    return contractKit
  } else {
    const httpProvider = new Web3.providers.HttpProvider(WEB3_PROVIDER_URL)
    const web3 = new Web3(httpProvider)
    contractKit = newKitFromWeb3(web3)
    return contractKit
  }
}
