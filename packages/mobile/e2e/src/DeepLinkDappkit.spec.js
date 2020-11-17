import dismissBanners from './utils/banners'
import RestoreAccountOnboarding from './usecases/RestoreAccountOnboarding'
import HandleDeepLinkDappkit from './usecases/HandleDeepLinkDappkit'

describe('Deep Link with account dappkit', () => {
  beforeEach(dismissBanners)
  describe('Onboarding', RestoreAccountOnboarding)
  describe('HandleDeepLinkSend', HandleDeepLinkDappkit)
})
