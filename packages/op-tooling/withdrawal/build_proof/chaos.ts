import { chainConfig } from 'viem/op-stack'
import { defineChain } from 'viem/utils'

const sourceId = 11_155_111 // sepolia

export const chaos = /*#__PURE__*/ defineChain({
  ...chainConfig,
  id: 11_162_320,
  name: 'Celo Chaos',
  nativeCurrency: {
    decimals: 18,
    name: 'CELO',
    symbol: 'CELO',
  },
  rpcUrls: {
    default: { http: ['https://forno.chaos.cel2.celo-networks-dev.org'] },
  },
  contracts: {
    ...chainConfig.contracts,
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
    },
    portal: {
      [sourceId]: {
        address: '0x101f7d8038BEb55D92919E9F944FEb0fAf211a9b',
      },
    },
    disputeGameFactory: {
      [sourceId]: {
        address: '0x338AC809E6A045cFC8AeB16Ff8a4329147B61AfB',
      },
    },
    l1StandardBridge: {
      [sourceId]: {
        address: '0x95F39a9dD86E4c777fD6Dc4404d94fD32C23Ea30',
      },
    },
  },
  sourceId,
  testnet: true,
})
