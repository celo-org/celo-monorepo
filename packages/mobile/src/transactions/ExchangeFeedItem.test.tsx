import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { EventTypeNames } from 'src/apollo/types'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { ExchangeFeedItem } from 'src/transactions/ExchangeFeedItem'
import { TransactionStatus, TransactionTypes } from 'src/transactions/reducer'
import { createMockStore, getMockI18nProps } from 'test/utils'

jest.mock('src/web3/contracts', () => ({
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

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
          __typename={EventTypeNames.Exchange}
          type={'EXCHANGE' as TransactionTypes}
          hash={'0x'}
          inValue={1}
          outValue={10}
          outSymbol={CURRENCY_ENUM.GOLD}
          inSymbol={CURRENCY_ENUM.DOLLAR}
          timestamp={1}
          showGoldAmount={true}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
