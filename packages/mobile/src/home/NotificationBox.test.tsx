import * as React from 'react'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { DAYS_TO_BACKUP } from 'src/backup/Backup'
import NotificationBox from 'src/home/NotificationBox'
import { createMockStore } from 'test/utils'
import { mockPaymentRequests } from 'test/values'

const TWO_DAYS_MS = 2 * 24 * 60 * 1000

const storeData = {
  goldToken: { educationCompleted: true },
  account: {
    backupCompleted: true,
    dismissedEarnRewards: true,
    dismissedInviteFriends: true,
    accountCreationTime: new Date().getTime() - TWO_DAYS_MS,
    paymentRequests: [],
  },
}

jest.mock('src/web3/contracts', () => ({
  web3: {
    utils: {
      fromWei: jest.fn((x: any) => x / 1e18),
    },
  },
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

describe('NotificationBox', () => {
  it('Simple test', () => {
    // const store = createMockStore(storeData)
    const store = createMockStore({
      ...storeData,
      account: {
        backupCompleted: false,
      },
    })
    const tree = renderer.create(
      <Provider store={store}>
        <NotificationBox />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('Backup too late test', () => {
    const store = createMockStore({
      ...storeData,
      account: {
        accountCreationTime: new Date().getTime() - DAYS_TO_BACKUP - TWO_DAYS_MS,
      },
    })
    const tree = renderer.create(
      <Provider store={store}>
        <NotificationBox />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('Educations not completed yet', () => {
    const store = createMockStore({
      ...storeData,
      goldToken: { educationCompleted: false },
      account: {
        backupCompleted: false,
        dismissedEarnRewards: false,
        dismissedInviteFriends: false,
        ...storeData.account,
      },
    })
    const tree = renderer.create(
      <Provider store={store}>
        <NotificationBox />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('Payment Requests exist', () => {
    const store = createMockStore({
      ...storeData,
      account: {
        ...storeData.account,
        paymentRequests: mockPaymentRequests,
      },
    })
    const tree = renderer.create(
      <Provider store={store}>
        <NotificationBox />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
