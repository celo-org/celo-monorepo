import BigNumber from 'bignumber.js'
import * as React from 'react'
import * as RNLocalize from 'react-native-localize'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { TokenTransactionType } from 'src/apollo/types'
import { AddressValidationType, E164NumberToAddressType } from 'src/identity/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import SendAmount from 'src/send/SendAmount'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import {
  mockAccount2Invite,
  mockAccountInvite,
  mockE164NumberInvite,
  mockTransactionData,
} from 'test/values'

const AMOUNT_ZERO = '0.00'
const AMOUNT_VALID = '4.93'
const AMOUNT_TOO_MUCH = '106.98'
const BALANCE_VALID = '23.85'

const storeData = {
  stableToken: { balance: BALANCE_VALID },
  fees: {
    estimates: {
      send: {
        feeInWei: '1',
      },
    },
  },
}

const TEXT_PLACEHOLDER = 'groceriesRent'
const AMOUNT_PLACEHOLDER = 'amount'

const mockScreenProps = getMockStackScreenProps(Screens.SendAmount, {
  recipient: mockTransactionData.recipient,
})

describe('SendAmount', () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  describe('when commenting', () => {
    const store = createMockStore(storeData)
    const getWrapper = () =>
      render(
        <Provider store={store}>
          <SendAmount {...mockScreenProps} />
        </Provider>
      )

    it('updates the comment/reason', () => {
      const wrapper = getWrapper()
      const input = wrapper.getByPlaceholder(TEXT_PLACEHOLDER)
      const comment = 'A comment!'
      fireEvent.changeText(input, comment)
      expect(wrapper.queryAllByDisplayValue(comment)).toHaveLength(1)
    })
  })

  describe('enter amount with balance', () => {
    const store = createMockStore(storeData)
    const getWrapper = () =>
      render(
        <Provider store={store}>
          <SendAmount {...mockScreenProps} />
        </Provider>
      )

    it('updates the amount', () => {
      const wrapper = getWrapper()
      const input = wrapper.getByPlaceholder(AMOUNT_PLACEHOLDER)
      fireEvent.changeText(input, AMOUNT_VALID)
      expect(wrapper.queryAllByDisplayValue(AMOUNT_VALID)).toHaveLength(1)
    })

    it('handles commas', () => {
      ;(RNLocalize.getNumberFormatSettings as jest.Mock).mockReturnValue({
        decimalSeparator: ',',
      })
      const wrapper = getWrapper()
      const input = wrapper.getByPlaceholder(AMOUNT_PLACEHOLDER)
      fireEvent.changeText(input, '4,0')
      expect(wrapper.queryAllByDisplayValue('4,0')).toHaveLength(1)
      ;(RNLocalize.getNumberFormatSettings as jest.Mock).mockReturnValue({
        decimalSeparator: '.',
      })
    })

    it('handles decimals', () => {
      const wrapper = getWrapper()
      const input = wrapper.getByPlaceholder(AMOUNT_PLACEHOLDER)
      fireEvent.changeText(input, '4.0')
      expect(wrapper.queryAllByDisplayValue('4.0')).toHaveLength(1)
    })
  })

  describe('enter amount', () => {
    it('shows an error when tapping the send button with not enough balance', () => {
      const store = createMockStore(storeData)
      const wrapper = render(
        <Provider store={store}>
          <SendAmount {...mockScreenProps} />
        </Provider>
      )

      const input = wrapper.getByPlaceholder(AMOUNT_PLACEHOLDER)
      fireEvent.changeText(input, AMOUNT_TOO_MUCH)

      const sendButton = wrapper.getByTestId('Send')
      expect(sendButton.props.disabled).toBe(false)

      store.clearActions()
      fireEvent.press(sendButton)
      expect(store.getActions()).toEqual([
        {
          alertType: 'error',
          buttonMessage: null,
          dismissAfter: 5000,
          message: 'needMoreFundsToSend',
          title: null,
          type: 'ALERT/SHOW',
          underlyingError: 'needMoreFundsToSend',
        },
      ])
    })

    it('disables the send button with 0 as amount', () => {
      const store = createMockStore(storeData)
      const wrapper = render(
        <Provider store={store}>
          <SendAmount {...mockScreenProps} />
        </Provider>
      )

      const input = wrapper.getByPlaceholder(AMOUNT_PLACEHOLDER)
      fireEvent.changeText(input, AMOUNT_ZERO)

      const sendButton = wrapper.getByTestId('Send')
      expect(sendButton.props.disabled).toBe(true)
    })
  })

  it('renders correctly for request payment confirmation', () => {
    const store = createMockStore({
      ...storeData,
      stableToken: { balance: AMOUNT_ZERO },
    })
    const tree = render(
      <Provider store={store}>
        <SendAmount {...mockScreenProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  describe('Navigation', () => {
    const mockE164NumberToAddress: E164NumberToAddressType = {
      [mockE164NumberInvite]: [mockAccountInvite, mockAccount2Invite],
    }

    const mockTransactionData2 = {
      ...mockTransactionData,
      amount: new BigNumber('3.70676691729323309'),
    }

    it('navigates to ValidatRecipientIntro screen on Send click when a manual address check is needed', () => {
      const store = createMockStore({
        identity: {
          e164NumberToAddress: mockE164NumberToAddress,
          secureSendPhoneNumberMapping: {
            [mockE164NumberInvite]: {
              addressValidationType: AddressValidationType.FULL,
            },
          },
        },
        ...storeData,
      })

      const tree = render(
        <Provider store={store}>
          <SendAmount {...mockScreenProps} />
        </Provider>
      )
      const input = tree.getByPlaceholder(AMOUNT_PLACEHOLDER)
      const input2 = tree.getByPlaceholder(TEXT_PLACEHOLDER)
      fireEvent.changeText(input, AMOUNT_VALID)
      fireEvent.changeText(input2, 'Something')
      fireEvent.press(tree.getByTestId('Send'))
      expect(navigate).toHaveBeenCalledWith(Screens.ValidateRecipientIntro, {
        transactionData: mockTransactionData2,
        addressValidationType: AddressValidationType.FULL,
      })
    })

    it('navigates to SendConfirmation screen on Send click when a manual address check is not needed', () => {
      const store = createMockStore({
        identity: {
          e164NumberToAddress: mockE164NumberToAddress,
          secureSendPhoneNumberMapping: {
            [mockE164NumberInvite]: {
              addressValidationType: AddressValidationType.NONE,
            },
          },
        },
        ...storeData,
      })

      const tree = render(
        <Provider store={store}>
          <SendAmount {...mockScreenProps} />
        </Provider>
      )
      const input = tree.getByPlaceholder(AMOUNT_PLACEHOLDER)
      const input2 = tree.getByPlaceholder(TEXT_PLACEHOLDER)
      fireEvent.changeText(input, AMOUNT_VALID)
      fireEvent.changeText(input2, 'Something')
      fireEvent.press(tree.getByTestId('Send'))
      expect(navigate).toHaveBeenCalledWith(Screens.SendConfirmation, {
        transactionData: mockTransactionData2,
      })
    })

    it('navigates to ValidatRecipientIntro screen on Request click when a manual address check is needed', () => {
      const store = createMockStore({
        identity: {
          e164NumberToAddress: mockE164NumberToAddress,
          secureSendPhoneNumberMapping: {
            [mockE164NumberInvite]: {
              addressValidationType: AddressValidationType.FULL,
            },
          },
        },
        ...storeData,
      })
      mockTransactionData2.type = TokenTransactionType.PayRequest

      const tree = render(
        <Provider store={store}>
          <SendAmount {...mockScreenProps} />
        </Provider>
      )
      const input = tree.getByPlaceholder(AMOUNT_PLACEHOLDER)
      const input2 = tree.getByPlaceholder(TEXT_PLACEHOLDER)
      fireEvent.changeText(input, AMOUNT_VALID)
      fireEvent.changeText(input2, 'Something')
      fireEvent.press(tree.getByTestId('Request'))
      expect(navigate).toHaveBeenCalledWith(Screens.ValidateRecipientIntro, {
        transactionData: mockTransactionData2,
        addressValidationType: AddressValidationType.FULL,
        isPaymentRequest: true,
      })
    })

    it('navigates to PaymentRequestConfirmation screen on Request click when a manual address check is not needed', () => {
      const store = createMockStore({
        identity: {
          e164NumberToAddress: mockE164NumberToAddress,
          secureSendPhoneNumberMapping: {
            [mockE164NumberInvite]: {
              addressValidationType: AddressValidationType.NONE,
            },
          },
        },
        ...storeData,
      })
      mockTransactionData2.type = TokenTransactionType.PayRequest

      const tree = render(
        <Provider store={store}>
          <SendAmount {...mockScreenProps} />
        </Provider>
      )
      const input = tree.getByPlaceholder(AMOUNT_PLACEHOLDER)
      const input2 = tree.getByPlaceholder(TEXT_PLACEHOLDER)
      fireEvent.changeText(input, AMOUNT_VALID)
      fireEvent.changeText(input2, 'Something')
      fireEvent.press(tree.getByTestId('Request'))
      expect(navigate).toHaveBeenCalledWith(Screens.PaymentRequestConfirmation, {
        transactionData: mockTransactionData2,
      })
    })
  })
})
