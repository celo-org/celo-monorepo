import { DEFAULT_SYNC_MODE, Testnets } from 'src/web3/testnets'

export default {
  [Testnets.integration]: {
    nodeDir: `.${Testnets.integration}`,
    syncMode: DEFAULT_SYNC_MODE,
    blockchainApiUrl: 'https://integration-dot-celo-testnet.appspot.com/',
  },
  [Testnets.alfajoresstaging]: {
    nodeDir: `.${Testnets.alfajoresstaging}`,
    syncMode: DEFAULT_SYNC_MODE,
    blockchainApiUrl: 'https://alfajoresstaging-dot-celo-testnet.appspot.com/',
  },
  [Testnets.alfajores]: {
    nodeDir: `.${Testnets.alfajores}`,
    syncMode: DEFAULT_SYNC_MODE,
    blockchainApiUrl: 'https://alfajores-dot-celo-testnet-production.appspot.com/',
  },
  [Testnets.pilot]: {
    nodeDir: `.${Testnets.pilot}`,
    syncMode: DEFAULT_SYNC_MODE,
    blockchainApiUrl: 'https://pilot-dot-celo-testnet-production.appspot.com/',
  },
  [Testnets.pilotstaging]: {
    nodeDir: `.${Testnets.pilotstaging}`,
    syncMode: DEFAULT_SYNC_MODE,
    blockchainApiUrl: 'https://pilotstaging-dot-celo-testnet.appspot.com/',
  },
}
