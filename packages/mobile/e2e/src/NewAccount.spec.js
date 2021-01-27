import dismissBanners from './utils/banners'
import NewAccountOnboarding from './usecases/NewAccountOnboarding'
import SetAccountKey from './usecases/SetAccountKey'
import NewAccountCeloScreen from './usecases/NewAccountCeloScreen'

describe.skip('New Account', () => {
  beforeEach(dismissBanners)

  describe('Onboarding', NewAccountOnboarding)
  describe('Account Key', SetAccountKey)
  describe('CELO', NewAccountCeloScreen)
})
