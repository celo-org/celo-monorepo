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
import { mockInvitableRecipient2, mockTransactionData } from 'test/values'

const store = createMockStore()
const mockTransactionData2 = {
  ...mockTransactionData,
  firebasePendingRequestUid: 1,
  type: TokenTransactionType.PayRequest,
}

describe('IncomingPaymentRequestListItem', () => {
  it('renders correctly', () => {
    const props = {
      id: 1,
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

    const tree = render(
      <Provider store={store}>
        // @ts-ignore -- kind is not assignable?
        <IncomingPaymentRequestListItem {...props} />
      </Provider>
    )

    expect(tree).toMatchSnapshot()
  })

  it('navigates to ValidateRecipientInfo screen when address needs validation', () => {
    const props = {
      id: 1,
      amount: new BigNumber(1),
      requester: mockInvitableRecipient2,
      addressValidationType: AddressValidationType.FULL,
    }

    const tree = render(
      <Provider store={store}>
        // @ts-ignore -- kind is not assignable?
        <IncomingPaymentRequestListItem {...props} />
      </Provider>
    )

    fireEvent.press(
      tree.getByTestId(
        `IncomingPaymentRequestNotification/${props.id}/CallToActions/global:send/Button`
      )
    )
    expect(navigate).toHaveBeenCalledWith(Screens.ValidateRecipientIntro, {
      transactionData: mockTransactionData2,
      addressValidationType: AddressValidationType.FULL,
    })
  })

  it('navigates to SendConfirmation screen when address does not need validation', () => {
    const props = {
      id: 1,
      amount: new BigNumber(1),
      requester: mockInvitableRecipient2,
      addressValidationType: AddressValidationType.NONE,
    }

    const tree = render(
      <Provider store={store}>
        // @ts-ignore -- kind is not assignable?
        <IncomingPaymentRequestListItem {...props} />
      </Provider>
    )

    fireEvent.press(
      tree.getByTestId(
        `IncomingPaymentRequestNotification/${props.id}/CallToActions/global:send/Button`
      )
    )
    expect(navigate).toHaveBeenCalledWith(Screens.SendConfirmation, {
      transactionData: mockTransactionData2,
    })
  })
})
