import Web3 from 'web3'

const PROXY_ABI = [
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
