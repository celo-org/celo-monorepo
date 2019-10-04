import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { PaymentRequestStatuses } from 'src/account'
import { SHORT_CURRENCIES } from 'src/geth/consts'
import PaymentRequestSummaryNotification from 'src/notifications/PaymentRequestSummaryNotification'
import { createMockStore } from 'test/utils'

const requesterE164Number = '+491522345678'
const requesteeAddress = '0x32142315123dasfas3e23r2r3'
const requesterAddress = '0x000000000000000000000ce10'
const currency = SHORT_CURRENCIES.DOLLAR

const date = new Date('Tue Mar 05 2019 13:44:06 GMT-0800 (Pacific Standard Time)')

const fakeRequests = [
  {
    amount: '200,000.00',
    uid: 'FAKE_ID_1',
    timestamp: date,
    comment: 'Dinner for me and the gals, PIZZAA!',
    requester: 'Jake',
    requesterE164Number,
    requesteeAddress,
    requesterAddress,
    status: PaymentRequestStatuses.REQUESTED,
    currency,
    notified: true,
  },
  {
    requester: 'Abibail Sarrah-Banks',
    timestamp: date,
    amount: '180.89',
    uid: 'FAKE_ID_2',
    comment: 'My Birthday Present. :) Am I not the best? Celebration. Bam!',
    requesterE164Number,
    requesteeAddress,
    requesterAddress,
    status: PaymentRequestStatuses.REQUESTED,
    currency,
    notified: true,
  },
  {
    requester: 'Abibail Sarrah-Banks',
    timestamp: date,
    amount: '180.89',
    uid: 'FAKE_ID_3',
    comment: 'My Birthday Present. :) Am I not the best? Celebration. Bam!',
    requesterE164Number,
    requesteeAddress,
    requesterAddress,
    status: PaymentRequestStatuses.REQUESTED,
    currency,
    notified: true,
  },
]
const store = createMockStore()

jest.mock('src/web3/contracts', () => ({
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

describe('PaymentRequestSummaryNotification', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={store}>
        <PaymentRequestSummaryNotification requests={fakeRequests} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  describe('when more than 2 requests', () => {
    it('renders just two', () => {
      const tree = renderer.create(
        <Provider store={store}>
          <PaymentRequestSummaryNotification requests={fakeRequests} />
        </Provider>
      )
      expect(tree).toMatchSnapshot()
    })
  })
  describe('when more 1 requests', () => {
    it('renders just it alone', () => {
      const tree = renderer.create(
        <Provider store={store}>
          <PaymentRequestSummaryNotification requests={fakeRequests.slice(0, 1)} />
        </Provider>
      )
      expect(tree).toMatchSnapshot()
    })
  })
})
