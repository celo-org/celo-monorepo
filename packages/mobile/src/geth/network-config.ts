import { SYNC_MODE_ULTRALIGHT } from 'src/geth/consts'
import { Testnets } from 'src/web3/testnets'

export default {
  [Testnets.integration]: {
    nodeDir: `.${Testnets.integration}`,
    peerDiscovery: false,
    syncMode: SYNC_MODE_ULTRALIGHT,
  },
  [Testnets.alfajoresstaging]: {
    nodeDir: `.${Testnets.alfajoresstaging}`,
    peerDiscovery: true,
    syncMode: SYNC_MODE_ULTRALIGHT,
  },
  [Testnets.alfajores]: {
    nodeDir: `.${Testnets.alfajores}`,
    peerDiscovery: false,
    syncMode: SYNC_MODE_ULTRALIGHT,
  },
  [Testnets.pilot]: {
    nodeDir: `.${Testnets.pilot}`,
    peerDiscovery: false,
    syncMode: SYNC_MODE_ULTRALIGHT,
  },
  [Testnets.pilotstaging]: {
    nodeDir: `.${Testnets.pilotstaging}`,
    peerDiscovery: false,
    syncMode: SYNC_MODE_ULTRALIGHT,
  },
}
