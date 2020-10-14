import { CURRENCY_ENUM } from '@celo/utils'
import { TokenTransactionType } from 'src/apollo/types'
import { FeedItem } from 'src/transactions/TransactionFeed'
import { TransactionStatus } from 'src/transactions/types'
import { groupFeedItemsInSections } from 'src/transactions/utils'

const mockFeedItem = (timestamp: number, comment: string): FeedItem => {
  return {
    __typename: 'TokenTransfer',
    type: TokenTransactionType.Sent,
    hash: 'any_value',
    amount: {
      value: '5.05',
      currencyCode: CURRENCY_ENUM.DOLLAR,
      localAmount: null,
    },
    timestamp,
    address: '0xanything',
    comment,
    status: TransactionStatus.Complete,
  }
}

const sept172019Timestamp = 1568735100000
const daysAgo = (days: number) => sept172019Timestamp - days * 24 * 60 * 60 * 1000

describe('groupFeedItemsInSections', () => {
  // Lock the time on Sept 17 2019.
  let dateNowSpy: any
  beforeAll(() => {
    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => sept172019Timestamp)
    // set the offset to ALWAYS be Pacific for these tests regardless of where they are run
    // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset
    jest.spyOn(Date.prototype, 'getTimezoneOffset').mockImplementation(() => 420)
  })
  afterAll(() => {
    dateNowSpy.mockRestore()
  })

  it('groups into sections correctly', () => {
    const feedItems = [
      mockFeedItem(daysAgo(3), 'recent'),
      mockFeedItem(daysAgo(5), 'recent'),
      mockFeedItem(daysAgo(15), 'september'),
      mockFeedItem(daysAgo(20), 'august'),
      mockFeedItem(daysAgo(30), 'august'),
      mockFeedItem(daysAgo(30), 'august'),
      mockFeedItem(daysAgo(50), 'july'),
      mockFeedItem(daysAgo(275), 'december 2018'),
      mockFeedItem(daysAgo(400), 'august 2018'),
    ]
    const sections = groupFeedItemsInSections(feedItems)
    expect(sections.length).toEqual(6)

    expect(sections[0].title).toEqual('walletFlow5:feedSectionHeaderRecent')
    expect(sections[0].data.length).toEqual(2)

    expect(sections[1].title).toEqual('September')
    expect(sections[1].data.length).toEqual(1)

    expect(sections[2].title).toEqual('August')
    expect(sections[2].data.length).toEqual(3)

    expect(sections[3].title).toEqual('July')
    expect(sections[3].data.length).toEqual(1)

    expect(sections[4].title).toEqual('December 2018')
    expect(sections[4].data.length).toEqual(1)

    expect(sections[5].title).toEqual('August 2018')
    expect(sections[5].data.length).toEqual(1)
  })
})
