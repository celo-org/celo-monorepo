import { chainConfig } from 'viem/op-stack'
import { defineChain } from 'viem/utils'

const sourceId = 1 // mainnet

export const celo = /*#__PURE__*/ defineChain({
  ...chainConfig,
  id: 42_220,
  name: 'Celo',
  nativeCurrency: {
    decimals: 18,
    name: 'CELO',
    symbol: 'CELO',
  },
  rpcUrls: {
    default: { http: ['https://forno.celo.org'] },
  },
  blockExplorers: {
    default: {
      name: 'Celo Explorer',
      url: 'https://celoscan.io',
      apiUrl: 'https://api.celoscan.io/api',
    },
  },
  contracts: {
    ...chainConfig.contracts,
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 13112599,
    },
    portal: {
      [sourceId]: {
        address: '0xc5c5D157928BDBD2ACf6d0777626b6C75a9EAEDC',
      },
    },
    disputeGameFactory: {
      [sourceId]: {
        address: '0xFbAC162162f4009Bb007C6DeBC36B1dAC10aF683',
      },
    },
    l1StandardBridge: {
      [sourceId]: {
        address: '0x9C4955b92F34148dbcfDCD82e9c9eCe5CF2badfe',
      },
    },
  },
  sourceId,
  testnet: false,
})
