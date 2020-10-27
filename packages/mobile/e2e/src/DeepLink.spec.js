import dismissBanners from './utils/banners'
import HandleDeepLinkSend from './usecases/HandleDeepLinkSend'

describe('Deep link', () => {
  beforeEach(dismissBanners)

  describe('HandleDeepLinkSend', HandleDeepLinkSend)
})
