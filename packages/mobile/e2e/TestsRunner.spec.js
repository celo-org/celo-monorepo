import dismissBanners from './src/utils/banners'
import Onboarding from './src/Onboarding'
import Send from './src/Send'
import ExchangeCelo from './src/ExchangeCelo'
import ResetAccount from './src/ResetAccount'

describe('Run tests', () => {
  beforeEach(dismissBanners)

  describe('Onboarding', Onboarding)
  describe('Send cUSD', Send)
  describe('Exchange CELO', ExchangeCelo)
  describe('Reset Account', ResetAccount)
})
