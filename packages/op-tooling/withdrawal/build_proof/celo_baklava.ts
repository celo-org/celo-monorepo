import { chainConfig } from 'viem/op-stack'
import { defineChain } from 'viem/utils'

const sourceId = 17000 // holesky

export const celoBaklava = /*#__PURE__*/ defineChain({
  ...chainConfig,
  id: 62320,
  name: 'Celo Baklava',
  nativeCurrency: { name: 'Celo', symbol: 'CELO', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://baklava-forno.celo-testnet.org/'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Celo Baklava Explorer',
      url: '',
      apiUrl: '',
    },
  },
  contracts: {
    ...chainConfig.contracts,
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 1,
    },
    portal: {
      [sourceId]: {
        address: '0x87e9cB54f185a32266689138fbA56F0C994CF50c',
      },
    },
    disputeGameFactory: {
      [sourceId]: {
        address: '0x788ef5850c3a51d41f59Dc4327017EF8D754eD80',
      },
    },
    l1StandardBridge: {
      [sourceId]: {
        address: '0x6fd3fF186975aD8B66Ab40b705EC016b36da0486',
      },
    },
  },
  sourceId,
  testnet: true,
})
