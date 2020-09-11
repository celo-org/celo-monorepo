import dismissBanners from './utils/banners'
import Onboarding from './usecases/Onboarding'

describe('CELO only Account', () => {
  beforeEach(dismissBanners)

  describe('Onboarding', Onboarding)
})
