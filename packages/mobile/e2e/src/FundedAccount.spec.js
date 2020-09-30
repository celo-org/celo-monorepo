import dismissBanners from './utils/banners'
import RestoreAccountOnboarding from './usecases/RestoreAccountOnboarding'
import Send from './usecases/Send'
import SecureSend from './usecases/SecureSend'
import ExchangeCelo from './usecases/ExchangeCelo'
import ResetAccount from './usecases/ResetAccount'

describe('Funded Account', () => {
  beforeEach(dismissBanners)

  describe('Onboarding', RestoreAccountOnboarding)
  describe('Send cUSD', Send)
  describe('Secure Send', SecureSend)
  describe('Exchange CELO', ExchangeCelo)
  describe('Reset Account', ResetAccount)
})
