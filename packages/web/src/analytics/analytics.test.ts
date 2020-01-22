import analytics from 'src/analytics/analytics'
import { isBrowser } from 'src/utils/utils'
jest.mock('src/utils/utils', () => ({
  isBrowser: jest.fn(),
}))

// TODO cant mock out process.browser currently
describe('analytics.track', () => {
  describe('when not process.browser', () => {
    it('returns fake tracker', async () => {
      // @ts-ignore
      isBrowser.mockImplementation(() => false)
      expect(await analytics.track('this')).toEqual(null)
    })
  })
  describe('when process is browser and  canTrack', () => {
    it('calls the real segment tracker', async () => {
      // @ts-ignore
      isBrowser.mockImplementation(() => true)
      expect(await analytics.track('that')).toEqual(true)
    })
  })
})
