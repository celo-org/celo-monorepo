import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { TokenTransactionType } from 'src/apollo/types'
import CeloTransferFeedItem from 'src/transactions/CeloTransferFeedItem'
import { TransactionStatus } from 'src/transactions/types'
import { createMockStore, getMockI18nProps } from 'test/utils'
import { mockAccount } from 'test/values'

const SAMPLE_ADDRESS = '0xcc642068bdbbdeb91f348213492d2a80ab1ed23c'

const localAmount = {
  value: '1.23',
  exchangeRate: '0.555',
  currencyCode: 'EUR',
}

describe('CeloTransferFeedItem', () => {
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
        <CeloTransferFeedItem
          status={TransactionStatus.Complete}
          __typename="TokenTransfer"
          type={TokenTransactionType.Exchange}
          hash={'0x'}
          amount={{ value: '-1.005', currencyCode: 'cGLD', localAmount }}
          address={SAMPLE_ADDRESS}
          comment={''}
          timestamp={1}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it("renders correctly when there's a known address", () => {
    const mockName = 'This is a Test'
    const tree = renderer.create(
      <Provider
        store={createMockStore({
          identity: {
            addressToDisplayName: {
              [mockAccount]: {
                name: mockName,
              },
            },
          },
        })}
      >
        <CeloTransferFeedItem
          status={TransactionStatus.Complete}
          __typename="TokenTransfer"
          type={TokenTransactionType.Received}
          hash={'0x'}
          amount={{ value: '1.005', currencyCode: 'cGLD', localAmount }}
          address={mockAccount}
          comment={''}
          timestamp={1}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
