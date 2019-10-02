import * as React from 'react'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { WalletHome } from 'src/home/WalletHome'
import { createMockStore, getMockI18nProps } from 'test/utils'

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

jest.mock('src/components/AccountOverview')
jest.mock('src/home/TransactionsList')

jest.mock('src/web3/contracts', () => ({
  web3: {
    utils: {
      fromWei: jest.fn((x: any) => x / 1e18),
    },
  },
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

describe('Testnet banner', () => {
  it('Shows testnet banner for 5 seconds', async () => {
    const store = createMockStore({
      ...storeData,
      account: {
        backupCompleted: false,
      },
    })
    const showMessageMock = jest.fn()
    const tree = renderer.create(
      <Provider store={store}>
        <WalletHome
          refreshAllBalances={jest.fn()}
          resetStandbyTransactions={jest.fn()}
          initializeSentryUserContext={jest.fn()}
          exitBackupFlow={jest.fn()}
          setLoading={jest.fn()}
          showMessage={showMessageMock}
          hideAlert={jest.fn()}
          importContacts={jest.fn()}
          loading={false}
          appConnected={true}
          address={null}
          recipientCache={{}}
          activeNotificationCount={0}
          callToActNotification={false}
          {...getMockI18nProps()}
        />
      </Provider>
    )

    expect(tree).toMatchSnapshot()
    expect(showMessageMock).toHaveBeenCalledWith('testnetAlert.1', 5000, null, 'testnetAlert.0')
  })
})
