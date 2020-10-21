import { AbiItem } from 'web3-utils'
import { ABI, newProxy } from '../generated/Proxy'
import { ContractKit } from '../kit'

export const getImplementation = (kit: ContractKit, proxyContractAddress: string) =>
  newProxy(kit.web3, proxyContractAddress).methods._getImplementation()

export const setImplementation = (kit: ContractKit, proxyAddress: string, implAddress: string) =>
  newProxy(kit.web3, proxyAddress).methods._setImplementation(implAddress)

export const getInitializeAbiOfImplementation = (proxyContractName: string) => {
  const implementationABI = require(`../generated/${proxyContractName.replace('Proxy', '')}`)
    .ABI as AbiItem[]
  return implementationABI.find((item) => item.name === 'initialize')
}

export const SET_IMPLEMENTATION_ABI = ABI.find((item) => item.name === '_setImplementation')!
export const SET_AND_INITIALIZE_IMPLEMENTATION_ABI = ABI.find(
  (item) => item.name === '_setAndInitializeImplementation'
)!
