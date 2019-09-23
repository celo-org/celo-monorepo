import { SYNC_MODE_ULTRALIGHT } from 'src/geth/consts'
import { Testnets } from 'src/web3/testnets'

export default {
  [Testnets.integration]: {
    nodeDir: `.${Testnets.integration}`,
    noDiscovery: true,
    syncMode: SYNC_MODE_ULTRALIGHT,
  },
  [Testnets.alfajoresstaging]: {
    nodeDir: `.${Testnets.alfajoresstaging}`,
    noDiscovery: true,
    syncMode: SYNC_MODE_ULTRALIGHT,
  },
  [Testnets.alfajores]: {
    nodeDir: `.${Testnets.alfajores}`,
    noDiscovery: true,
    syncMode: SYNC_MODE_ULTRALIGHT,
  },
  [Testnets.pilot]: {
    nodeDir: `.${Testnets.pilot}`,
    noDiscovery: true,
    syncMode: SYNC_MODE_ULTRALIGHT,
  },
  [Testnets.pilotstaging]: {
    nodeDir: `.${Testnets.pilotstaging}`,
    noDiscovery: true,
    syncMode: SYNC_MODE_ULTRALIGHT,
  },
}
