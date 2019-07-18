import { AppRegistry } from 'react-native'
import logger from 'src/utils/logger'
import App from './src/App.tsx'

logger.overrideConsoleLogs()

AppRegistry.registerComponent('verifier', () => App)
