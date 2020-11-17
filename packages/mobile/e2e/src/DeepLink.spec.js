import dismissBanners from './utils/banners'
import HandleDeepLinkSend from './usecases/HandleDeepLinkSend'
import ResetAccount from './usecases/ResetAccount'
import RestoreAccountOnboarding from './usecases/RestoreAccountOnboarding'
import HandleDeepLinkDappkit from './usecases/HandleDeepLinkDappkit'

describe('Deep link without account send', () => {
  beforeEach(dismissBanners)

  // The behavior for this case is not really specified yet
  // we kind of know what we want to happen but the code is not there yet
  // added this test case as a reminder to fix that
  // basically we want the app to remember the deep link and handle it after
  // the account is created or restored
  // also would be great if the deep link survives through an app install
  // similar to the invite links

  describe('HandleDeepLinkSend', HandleDeepLinkSend)
})

describe('Deep Link with account dappkit', () => {
  beforeEach(dismissBanners)
  // actually if the account is not setup the experience is bad
  // because we don't check anything and obviously things fail
  // so we should fix that also
  describe('Onboarding', RestoreAccountOnboarding)
  describe('HandleDeepLinkSend', HandleDeepLinkDappkit)
  describe('Reset Account', ResetAccount)
})
