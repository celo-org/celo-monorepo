import Config from 'react-native-config'

export enum Testnets {
  integration = 'integration',
  alfajoresstaging = 'alfajoresstaging',
  alfajores = 'alfajores',
  pilot = 'pilot',
  pilotstaging = 'pilotstaging',
}

export const DEFAULT_TESTNET: Testnets = Config.DEFAULT_TESTNET
