import Config from 'react-native-config'
import { TimerContext } from 'victory-core/es'

// Inject custom e2e config
Config.IS_E2E = true

// Disable VictoryCharts timer during E2E tests as it uses `requestAnimationFrame`
// continuously and prevents Detox from detecting an 'idle' state
// This is relatively fragile.
// If this fails, check TimerContext internals with
// `console.log('VictoryCore TimerContext internals', TimerContext)`
// and adjust accordingly.
// Long term fix would be to disable RN timer tracking within Detox
// see https://github.com/wix/Detox/issues/1513
TimerContext._currentValue.transitionTimer.stop()
TimerContext._currentValue.animationTimer.stop()
