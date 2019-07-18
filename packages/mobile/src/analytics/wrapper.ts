import componentWithAnalyticsInitializer from '@celo/react-components/analytics/wrapper'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import Logger from 'src/utils/Logger'

export const componentWithAnalytics = componentWithAnalyticsInitializer(CeloAnalytics, Logger)

export default componentWithAnalytics
