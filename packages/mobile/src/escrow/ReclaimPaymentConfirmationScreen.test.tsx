import BigNumber from 'bignumber.js'
import * as React from 'react'
import { render, waitForElement } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import ReclaimPaymentConfirmationScreen from 'src/escrow/ReclaimPaymentConfirmationScreen'
import { getReclaimEscrowFee } from 'src/escrow/saga'
import { SHORT_CURRENCIES, WEI_PER_CELO } from 'src/geth/consts'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockAccount, mockAccount2, mockE164Number } from 'test/values'

const TEST_FEE = new BigNumber(10000000000000000)

jest.mock('src/escrow/saga')

const mockedGetReclaimEscrowFee = getReclaimEscrowFee as jest.Mock

const store = createMockStore()

const mockScreenProps = getMockStackScreenProps(Screens.ReclaimPaymentConfirmationScreen, {
  reclaimPaymentInput: {
    senderAddress: mockAccount2,
    recipientPhone: mockE164Number,
    paymentID: mockAccount,
    currency: SHORT_CURRENCIES.DOLLAR,
    amount: new BigNumber(10 * WEI_PER_CELO),
    timestamp: new BigNumber(10000),
    expirySeconds: new BigNumber(50000),
  },
})

describe('ReclaimPaymentConfirmationScreen', () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  beforeEach(() => {
    mockedGetReclaimEscrowFee.mockClear()
  })

  it('renders correctly', async () => {
    mockedGetReclaimEscrowFee.mockImplementation(async () => TEST_FEE)

    const { queryByText, queryAllByText, toJSON } = render(
      <Provider store={store}>
        <ReclaimPaymentConfirmationScreen {...mockScreenProps} />
      </Provider>
    )

    // Initial render
    expect(toJSON()).toMatchSnapshot()
    expect(queryAllByText('securityFee')).toHaveLength(2)
    expect(queryByText('$0.001')).toBeNull()

    // Wait for fee to be calculated and displayed
    // TODO fix and re-enable, seeing the same issue as in TransferReviewCard
    // await waitForElement(() => getByText('$0.001'))

    // expect(queryByText('$9.99')).not.toBeNull()
    // expect(toJSON()).toMatchSnapshot()
  })

  it('renders correctly when fee calculation fails', async () => {
    mockedGetReclaimEscrowFee.mockImplementation(async () => {
      throw new Error('Calculate fee failed')
    })

    const { queryAllByText, queryByText, getByText, toJSON } = render(
      <Provider store={store}>
        <ReclaimPaymentConfirmationScreen {...mockScreenProps} />
      </Provider>
    )

    // Initial render
    expect(toJSON()).toMatchSnapshot()
    expect(queryAllByText('securityFee')).toHaveLength(2)
    expect(queryByText('$0.001')).toBeNull()
    expect(queryAllByText('10.00')).toHaveLength(1)

    // Wait for fee error
    await waitForElement(() => getByText('---'))

    expect(queryAllByText('10.00')).toHaveLength(1)
    expect(toJSON()).toMatchSnapshot()
  })
})
