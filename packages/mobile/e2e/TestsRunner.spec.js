import dismissBanners from './src/utils/banners'
import Onboarding from './src/Onboarding'
import Send from './src/Send'
import Withdraw from './src/Withdraw'
import ResetAccount from './src/ResetAccount'

describe('Run tests', () => {
  beforeEach(dismissBanners)

  describe('Onboarding', Onboarding)
  describe('Send cUSD', Send)
  describe('Withdraw CELO', Withdraw)
  describe('Reset Account', ResetAccount)
})
