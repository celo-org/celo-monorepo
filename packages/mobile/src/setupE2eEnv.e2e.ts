import Config from 'react-native-config'
// @ts-ignore
import { TimerContext } from 'victory-core'
// @ts-ignore
import { TimerContext as TimerContextES } from 'victory-core/es'

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
// Also victory-native ends up importing 2 different victory-core
// so fix both until this is resolved upstream.
TimerContext._currentValue.transitionTimer.stop()
TimerContext._currentValue.animationTimer.stop()
// @ts-ignore
TimerContextES._currentValue.transitionTimer.stop()
// @ts-ignore
TimerContextES._currentValue.animationTimer.stop()
