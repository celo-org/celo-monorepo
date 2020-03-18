import Web3 from 'web3'
import { ABIDefinition } from 'web3-eth-abi'

export const PROXY_ABI: ABIDefinition[] = [
  {
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
  },
  {
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
  },
]

export const getImplementationOfProxy = async (
  web3: Web3,
  proxyContractAddress: string
): Promise<string> => {
  const proxyWeb3Contract = new web3.eth.Contract(PROXY_ABI, proxyContractAddress)
  return proxyWeb3Contract.methods._getImplementation().call()
}

export const setImplementationOnProxy = (address: string) => {
  const web3 = new Web3()
  const proxyWeb3Contract = new web3.eth.Contract(PROXY_ABI)
  return proxyWeb3Contract.methods._setImplementation(address)
}
