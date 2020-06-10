import BigNumber from 'bignumber.js'
import * as React from 'react'
import { fireEvent, render, waitForElement } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { AddressValidationType, E164NumberToAddressType } from 'src/identity/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getSendFee } from 'src/send/saga'
import SendConfirmation from 'src/send/SendConfirmation'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import {
  mockAccount2Invite,
  mockAccountInvite,
  mockE164NumberInvite,
  mockTransactionData,
} from 'test/values'

const TEST_FEE = new BigNumber(10000000000000000)

jest.mock('src/send/saga')

const mockedGetSendFee = getSendFee as jest.Mock

const mockScreenProps = getMockStackScreenProps(Screens.SendConfirmation, {
  transactionData: mockTransactionData,
})

describe('SendConfirmation', () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  beforeEach(() => {
    mockedGetSendFee.mockClear()
  })

  it('renders correctly for send payment confirmation', async () => {
    mockedGetSendFee.mockImplementation(async () => TEST_FEE)

    const store = createMockStore({
      stableToken: {
        balance: '200',
      },
    })

    const { toJSON, queryByText } = render(
      <Provider store={store}>
        <SendConfirmation {...mockScreenProps} />
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

    const store = createMockStore({
      stableToken: {
        balance: '200',
      },
    })

    const { queryByText, getByText, toJSON } = render(
      <Provider store={store}>
        <SendConfirmation {...mockScreenProps} />
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

  it('renders correctly when there are multiple user addresses (should show edit button)', async () => {
    const mockE164NumberToAddress: E164NumberToAddressType = {
      [mockE164NumberInvite]: [mockAccountInvite, mockAccount2Invite],
    }

    const store = createMockStore({
      stableToken: {
        balance: '200',
      },
      identity: {
        e164NumberToAddress: mockE164NumberToAddress,
        secureSendPhoneNumberMapping: {
          [mockE164NumberInvite]: {
            addressValidationType: AddressValidationType.FULL,
            address: mockAccount2Invite,
          },
        },
      },
    })

    const tree = render(
      <Provider store={store}>
        <SendConfirmation {...mockScreenProps} />
      </Provider>
    )

    expect(tree).toMatchSnapshot()
  })

  it('updates the comment/reason', () => {
    const store = createMockStore({
      fees: {
        estimates: {
          send: {
            feeInWei: '1',
          },
        },
      },
    })

    const tree = render(
      <Provider store={store}>
        <SendConfirmation {...mockScreenProps} />
      </Provider>
    )

    const input = tree.getByTestId('commentInput/send')
    const comment = 'A comment!'
    fireEvent.changeText(input, comment)
    expect(tree.queryAllByDisplayValue(comment)).toHaveLength(1)
  })

  it('navigates to ValidateRecipientIntro when "edit" button is pressed', async () => {
    const mockE164NumberToAddress: E164NumberToAddressType = {
      [mockE164NumberInvite]: [mockAccountInvite, mockAccount2Invite],
    }

    const mockAddressValidationType = AddressValidationType.PARTIAL

    const store = createMockStore({
      stableToken: {
        balance: '200',
      },
      identity: {
        e164NumberToAddress: mockE164NumberToAddress,
        secureSendPhoneNumberMapping: {
          [mockE164NumberInvite]: {
            addressValidationType: mockAddressValidationType,
            address: mockAccount2Invite,
          },
        },
      },
    })

    const tree = render(
      <Provider store={store}>
        <SendConfirmation {...mockScreenProps} />
      </Provider>
    )

    fireEvent.press(tree.getByTestId('accountEditButton'))
    expect(navigate).toHaveBeenCalledWith(Screens.ValidateRecipientIntro, {
      transactionData: mockTransactionData,
      addressValidationType: mockAddressValidationType,
    })
  })

  it('does nothing when trying to press "edit" when user has not gone through Secure Send', async () => {
    const mockE164NumberToAddress: E164NumberToAddressType = {
      [mockE164NumberInvite]: [mockAccount2Invite],
    }

    const store = createMockStore({
      stableToken: {
        balance: '200',
      },
      identity: {
        e164NumberToAddress: mockE164NumberToAddress,
        secureSendPhoneNumberMapping: {
          [mockE164NumberInvite]: {
            addressValidationType: AddressValidationType.NONE,
            address: undefined,
          },
        },
      },
    })

    const tree = render(
      <Provider store={store}>
        <SendConfirmation {...mockScreenProps} />
      </Provider>
    )

    expect(tree.queryByTestId('accountEditButton')).toBeNull()
  })
})
