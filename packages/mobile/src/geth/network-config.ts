import { SYNC_MODE_ULTRALIGHT } from 'src/geth/consts'
import { Testnets } from 'src/web3/testnets'

export default {
  [Testnets.integration]: {
    nodeDir: `.${Testnets.integration}`,
    syncMode: SYNC_MODE_ULTRALIGHT,
    blockchainApiUrl: 'https://integration-dot-celo-testnet.appspot.com/',
  },
  [Testnets.alfajoresstaging]: {
    nodeDir: `.${Testnets.alfajoresstaging}`,
    syncMode: SYNC_MODE_ULTRALIGHT,
    blockchainApiUrl: 'https://alfajoresstaging-dot-celo-testnet.appspot.com/',
  },
  [Testnets.alfajores]: {
    nodeDir: `.${Testnets.alfajores}`,
    syncMode: SYNC_MODE_ULTRALIGHT,
    blockchainApiUrl: 'https://alfajores-dot-celo-testnet-production.appspot.com/',
  },
  [Testnets.pilot]: {
    nodeDir: `.${Testnets.pilot}`,
    syncMode: SYNC_MODE_ULTRALIGHT,
    blockchainApiUrl: 'https://pilot-dot-celo-testnet-production.appspot.com/',
  },
  [Testnets.pilotstaging]: {
    nodeDir: `.${Testnets.pilotstaging}`,
    syncMode: SYNC_MODE_ULTRALIGHT,
    blockchainApiUrl: 'https://pilotstaging-dot-celo-testnet.appspot.com/',
  },
}
