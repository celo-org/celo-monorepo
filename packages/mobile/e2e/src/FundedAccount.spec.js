import dismissBanners from './utils/banners'
import Onboarding from './usecases/Onboarding'
import Send from './usecases/Send'
import ExchangeCelo from './usecases/ExchangeCelo'
import ResetAccount from './usecases/ResetAccount'

describe('Funded Account', () => {
  beforeEach(dismissBanners)

  describe('Onboarding', Onboarding)
  describe('Send cUSD', Send)
  describe('Exchange CELO', ExchangeCelo)
  describe('Reset Account', ResetAccount)
})
