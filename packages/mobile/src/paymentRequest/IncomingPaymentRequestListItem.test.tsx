import BigNumber from 'bignumber.js'
import * as React from 'react'
import 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { TokenTransactionType } from 'src/apollo/types'
import { AddressValidationType } from 'src/identity/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import IncomingPaymentRequestListItem from 'src/paymentRequest/IncomingPaymentRequestListItem'
import { RecipientKind } from 'src/recipients/recipient'
import { createMockStore } from 'test/utils'

const props = {
  id: '1',
  amount: '24',
  comment: 'Hey thanks for the loan, Ill pay you back ASAP. LOVE YOU',
  requester: {
    kind: RecipientKind.MobileNumber,
    e164PhoneNumber: '+15126608970',
    displayId: '5126608970',
    address: '0x91623f625e23ac1400',
    displayName: '5126608970',
    contact: undefined,
  },
}

const mockTransactionData = {
  recipient: props.requester,
  amount: new BigNumber(props.amount),
  reason: props.comment,
  type: TokenTransactionType.PayRequest,
  firebasePendingRequestUid: props.id,
}

describe('IncomingPaymentRequestListItem', () => {
  it('renders correctly', () => {
    const store = createMockStore()

    const tree = render(
      <Provider store={store}>
        // @ts-ignore -- kind is not assignable?
        <IncomingPaymentRequestListItem {...props} />
      </Provider>
    )

    expect(tree).toMatchSnapshot()
  })

  it('displays the loading animation while fetching addresses', () => {
    const store = createMockStore()

    const tree = render(
      <Provider store={store}>
        // @ts-ignore -- kind is not assignable?
        <IncomingPaymentRequestListItem {...props} />
      </Provider>
    )
    fireEvent.press(tree.getByText('global:send'))
    expect(tree.queryByTestId('loading/paymentRequest')).not.toBeNull()
  })

  it('navigates to send confirmation if there is no validation needed ', () => {
    const store = createMockStore({
      identity: {
        isFetchingAddresses: true,
        secureSendPhoneNumberMapping: {},
      },
    })

    const tree = render(
      <Provider store={store}>
        // @ts-ignore -- kind is not assignable?
        <IncomingPaymentRequestListItem {...props} />
      </Provider>
    )

    const updatedStore = createMockStore({
      identity: {
        isFetchingAddresses: false,
        secureSendPhoneNumberMapping: {
          [props.requester.e164PhoneNumber]: {
            addressValidationType: AddressValidationType.NONE,
          },
        },
      },
    })

    tree.rerender(
      <Provider store={updatedStore}>
        // @ts-ignore -- kind is not assignable?
        <IncomingPaymentRequestListItem {...props} />
      </Provider>
    )

    expect(navigate).toHaveBeenCalledWith(Screens.SendConfirmation, {
      transactionData: mockTransactionData,
    })
  })

  it('navigates to secure send if there is validation needed ', () => {
    const store = createMockStore({
      identity: {
        isFetchingAddresses: true,
        secureSendPhoneNumberMapping: {},
      },
    })

    const tree = render(
      <Provider store={store}>
        // @ts-ignore -- kind is not assignable?
        <IncomingPaymentRequestListItem {...props} />
      </Provider>
    )

    const updatedStore = createMockStore({
      identity: {
        isFetchingAddresses: false,
        secureSendPhoneNumberMapping: {
          [props.requester.e164PhoneNumber]: {
            addressValidationType: AddressValidationType.PARTIAL,
          },
        },
      },
    })

    tree.rerender(
      <Provider store={updatedStore}>
        // @ts-ignore -- kind is not assignable?
        <IncomingPaymentRequestListItem {...props} />
      </Provider>
    )

    expect(navigate).toHaveBeenCalledWith(Screens.ValidateRecipientIntro, {
      transactionData: mockTransactionData,
      addressValidationType: AddressValidationType.PARTIAL,
    })
  })
})
