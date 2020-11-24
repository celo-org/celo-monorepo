import Cookie from 'js-cookie'
import analytics, {
  agree,
  ALLOW_ANALYTICS_COOKIE_NAME,
  RESPONDED_TO_CONSENT,
} from 'src/analytics/analytics'
import { isBrowser } from 'src/utils/utils'
jest.mock('src/utils/utils', () => ({
  isBrowser: jest.fn(),
}))
jest.mock('js-cookie', () => {
  return {
    get: jest.fn(() => true),
    set: jest.fn(),
  }
})

describe('analytics.track', () => {
  describe('when not process.browser', () => {
    it('returns fake tracker', async () => {
      // @ts-ignore
      isBrowser.mockImplementation(() => false)
      expect(await analytics.track('this')).toEqual(null)
    })
  })
})

describe('agree', () => {
  it('sets the cookies', async () => {
    await agree()
    expect(Cookie.set).toHaveBeenCalledWith(ALLOW_ANALYTICS_COOKIE_NAME, true, { expires: 365 })
    expect(Cookie.set).toHaveBeenCalledWith(RESPONDED_TO_CONSENT, true, { expires: 365 })
  })
})
