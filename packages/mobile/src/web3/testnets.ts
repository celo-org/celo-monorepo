import Config from 'react-native-config'
import { _DEFAULT_SYNC_MODE } from 'src/config'
import { GethSyncMode } from 'src/geth/consts'

export enum Testnets {
  integration = 'integration',
  alfajoresstaging = 'alfajoresstaging',
  alfajores = 'alfajores',
  pilot = 'pilot',
  pilotstaging = 'pilotstaging',
}

export const DEFAULT_TESTNET: Testnets = Config.DEFAULT_TESTNET
export const DEFAULT_SYNC_MODE: GethSyncMode = _DEFAULT_SYNC_MODE
