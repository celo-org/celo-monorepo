import { ABIDefinition } from 'web3-eth-abi'

export const GET_IMPLEMENTATION_ABI: ABIDefinition = {
  constant: true,
  inputs: [],
  name: '_getImplementation',
  outputs: [
    {
      name: 'implementation',
      type: 'address',
    },
  ],
  payable: false,
  stateMutability: 'view',
  type: 'function',
  signature: '0x42404e07',
}

export const SET_IMPLEMENTATION_ABI: ABIDefinition = {
  constant: false,
  inputs: [
    {
      name: 'implementation',
      type: 'address',
    },
  ],
  name: '_setImplementation',
  outputs: [],
  payable: false,
  stateMutability: 'nonpayable',
  type: 'function',
  signature: '0xbb913f41',
}

export const SET_AND_INITIALIZE_IMPLEMENTATION_ABI: ABIDefinition = {
  constant: false,
  inputs: [
    {
      name: 'implementation',
      type: 'address',
    },
    {
      name: 'callbackData',
      type: 'bytes',
    },
  ],
  name: '_setAndInitializeImplementation',
  outputs: [],
  payable: true,
  stateMutability: 'payable',
  type: 'function',
  signature: '0x03386ba3',
}

export const PROXY_ABI: ABIDefinition[] = [
  GET_IMPLEMENTATION_ABI,
  SET_IMPLEMENTATION_ABI,
  SET_AND_INITIALIZE_IMPLEMENTATION_ABI,
]

export const PROXY_SET_IMPLEMENTATION_SIGNATURE = SET_IMPLEMENTATION_ABI.signature
export const PROXY_SET_AND_INITIALIZE_IMPLEMENTATION_SIGNATURE =
  SET_AND_INITIALIZE_IMPLEMENTATION_ABI.signature

export const getInitializeAbiOfImplementation = (proxyContractName: string) => {
  const implementationABI: any = undefined /* require(`../generated/${proxyContractName.replace('Proxy', '')}`)
    .ABI as AbiItem[] */
  const initializeAbi = implementationABI.find((item: any) => item.name === 'initialize')
  if (!initializeAbi) {
    throw new Error(`Initialize method not found on implementation of ${proxyContractName}`)
  }
  return initializeAbi
}
