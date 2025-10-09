import { chainConfig } from 'viem/op-stack'
import { defineChain } from 'viem/utils'

const sourceId = 11155111 // sepolia

export const celoSepolia = /*#__PURE__*/ defineChain({
  ...chainConfig,
  id: 11142220,
  name: 'Celo Sepolia',
  nativeCurrency: { name: 'Celo', symbol: 'CELO', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://forno.celo-sepolia.celo-testnet.org/'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Celo Sepolia Explorer',
      url: '',
      apiUrl: '',
    },
  },
  contracts: {
    ...chainConfig.contracts,
    disputeGameFactory: {
      [sourceId]: {
        address: '0x57c45d82d1a995f1e135b8d7edc0a6bb5211cfaa',
      },
    },
    l2OutputOracle: {
      [sourceId]: {
        address: '0xd73ba8168a61f3e917f0930d5c0401aa47e269d6',
      },
    },
    portal: {
      [sourceId]: {
        address: '0x44ae3d41a335a7d05eb533029917aad35662dcc2',
      },
    },
    l1StandardBridge: {
      [sourceId]: {
        address: '0xec18a3c30131a0db4246e785355fbc16e2eaf408',
      },
    },
  },
  sourceId,
})
