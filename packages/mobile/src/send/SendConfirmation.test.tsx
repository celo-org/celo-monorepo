import BigNumber from 'bignumber.js'
import * as React from 'react'
import { render, waitForElement } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { TokenTransactionType } from 'src/apollo/types'
import { Screens } from 'src/navigator/Screens'
import { getSendFee } from 'src/send/saga'
import SendConfirmation from 'src/send/SendConfirmation'
import { createMockStore } from 'test/utils'
import { mockAccount, mockNavigation, mockRecipient } from 'test/values'

const TEST_FEE = new BigNumber(10000000000000000)

jest.mock('src/send/saga')

const mockedGetSendFee = getSendFee as jest.Mock

const store = createMockStore({
  stableToken: {
    balance: '200',
  },
})

const mockRoute = {
  name: Screens.SendConfirmation as Screens.SendConfirmation,
  key: '',
  params: {
    confirmationInput: {
      recipient: mockRecipient,
      type: TokenTransactionType.Sent,
      recipientAddress: mockAccount,
      amount: new BigNumber(10),
      reason: 'My Reason',
    },
  },
}

describe('SendConfirmation', () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  beforeEach(() => {
    mockedGetSendFee.mockClear()
  })

  it('renders correctly for send payment confirmation', async () => {
    mockedGetSendFee.mockImplementation(async () => TEST_FEE)

    const { toJSON, queryByText } = render(
      <Provider store={store}>
        <SendConfirmation navigation={mockNavigation} route={mockRoute} />
      </Provider>
    )

    // Initial render
    expect(toJSON()).toMatchSnapshot()
    expect(queryByText('securityFee')).not.toBeNull()
    expect(queryByText('0.001')).toBeNull()

    // TODO figure out why this waitForElement isn't working here and in tests below.
    // Wait for fee to be calculated and displayed
    // await waitForElement(() => getByText('0.001'))
    // expect(queryByText('0.001')).not.toBeNull()

    // expect(toJSON()).toMatchSnapshot()
  })

  it('renders correctly for send payment confirmation when fee calculation fails', async () => {
    mockedGetSendFee.mockImplementation(async () => {
      throw new Error('Calculate fee failed')
    })

    const { queryByText, getByText, toJSON } = render(
      <Provider store={store}>
        <SendConfirmation navigation={mockNavigation} route={mockRoute} />
      </Provider>
    )

    // Initial render
    expect(toJSON()).toMatchSnapshot()
    expect(queryByText('securityFee')).not.toBeNull()
    expect(queryByText('0.0100')).toBeNull()

    // Wait for fee error
    await waitForElement(() => getByText('---'))

    expect(toJSON()).toMatchSnapshot()
  })
})
