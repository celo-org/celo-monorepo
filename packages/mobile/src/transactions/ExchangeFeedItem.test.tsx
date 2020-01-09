import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { TransactionType } from 'src/apollo/types'
import { ExchangeFeedItem } from 'src/transactions/ExchangeFeedItem'
import { TransactionStatus } from 'src/transactions/reducer'
import { createMockStore, getMockI18nProps } from 'test/utils'

describe('ExchangeFeedItem', () => {
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

  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <ExchangeFeedItem
          status={TransactionStatus.Complete}
          __typename="TransactionExchange"
          type={TransactionType.Exchange}
          hash={'0x'}
          amount={{ amount: '-1', currencyCode: 'cUSD', localAmount: null }}
          makerAmount={{ amount: '1', currencyCode: 'cUSD', localAmount: null }}
          takerAmount={{ amount: '10', currencyCode: 'cGLD', localAmount: null }}
          timestamp={1}
          showGoldAmount={true}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
