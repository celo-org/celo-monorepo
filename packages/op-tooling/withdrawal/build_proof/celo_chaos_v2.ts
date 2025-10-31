import { chainConfig } from 'viem/op-stack'
import { defineChain } from 'viem/utils'

const sourceId = 11155111 // sepolia

export const celoChaosV2 = /*#__PURE__*/ defineChain({
  ...chainConfig,
  id: 11162320,
  name: 'Celo Chaos V2',
  nativeCurrency: { name: 'Celo', symbol: 'CELO', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://forno.chaos.cel2.celo-networks-dev.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Celo Chaos V2 Explorer',
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
        address: '0x37e3521cc2c2e3fc12ad4adc36aa8f6b6b686473',
      },
    },
    disputeGameFactory: {
      [sourceId]: {
        address: '0xc0215f0202418568c06b899f5e11245dbf717802',
      },
    },
    l1StandardBridge: {
      [sourceId]: {
        address: '0xb2f2468d0ab462da6cab2ef547fefd3511e33d14',
      },
    },
  },
  sourceId,
  testnet: true,
})
