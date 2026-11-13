import { chainConfig } from 'viem/op-stack'
import { defineChain } from 'viem/utils'

const sourceId = 11_155_111 // sepolia

export const havoc = /*#__PURE__*/ defineChain({
  ...chainConfig,
  id: 33_362_320,
  name: 'Celo Havoc',
  nativeCurrency: {
    decimals: 18,
    name: 'CELO',
    symbol: 'CELO',
  },
  rpcUrls: {
    default: { http: ['https://forno-havoc.cel2.celo-networks-dev.org'] },
  },
  contracts: {
    ...chainConfig.contracts,
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
    },
    portal: {
      [sourceId]: {
        address: '0x7a79515f9f916f38B1AED2DDc2658139C2ecF709',
      },
    },
    disputeGameFactory: {
      [sourceId]: {
        address: '0x6C4F9BF787bbBEcBF9D90Eb23791abd778905469',
      },
    },
    l1StandardBridge: {
      [sourceId]: {
        address: '0x43D86Fc65FB1c5a1A16fE0E44A47519681CF7D68',
      },
    },
  },
  sourceId,
  testnet: true,
})
