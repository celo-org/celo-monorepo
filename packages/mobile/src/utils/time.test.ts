import i18n from 'src/i18n'
import { formatFeedDate, formatFeedTime } from 'src/utils/time'

describe('utils/time', () => {
  let dateNowSpy: any
  beforeAll(() => {
    // Lock Time
    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => 1487076708000)
    // set the offset to ALWAYS be Pacific for these tests regardless of where they are run
    // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset
    jest.spyOn(Date.prototype, 'getTimezoneOffset').mockImplementation(() => 420)
  })

  afterAll(() => {
    // Unlock Time
    dateNowSpy.mockRestore()
  })
  const wedMarch132019at350pacific = 1552517413326
  describe('formatFeedTime', () => {
    it('returns time formatted as string and is accurate', () => {
      expect(formatFeedTime(wedMarch132019at350pacific, i18n)).toEqual('3:50 PM')
    })
    it('works when number is in seconds', () => {
      expect(formatFeedTime(wedMarch132019at350pacific / 1000, i18n)).toEqual('3:50 PM')
    })
  })
  describe('formatFeedDate', () => {
    it('returns date formatted as string and is accurate', () => {
      expect(formatFeedDate(wedMarch132019at350pacific, i18n)).toEqual('Mar 13')
    })
    it('works when number is in seconds', () => {
      expect(formatFeedDate(wedMarch132019at350pacific / 1000, i18n)).toEqual('Mar 13')
    })
  })
})
