import * as React from 'react'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { TokenTransactionType } from 'src/apollo/types'
import { AddressValidationType } from 'src/identity/reducer'
import { Screens } from 'src/navigator/Screens'
import TransactionReview from 'src/transactions/TransactionReview'
import { createMockStore } from 'test/utils'
import { mockAccount, mockAccount2, mockE164NumberInvite, mockNavigation } from 'test/values'

describe('TransactionReview', () => {
  it('to show address changed text when recipient address has changed', () => {
    const store = createMockStore({
      identity: {
        secureSendPhoneNumberMapping: {
          [mockE164NumberInvite]: {
            addressValidationType: AddressValidationType.NONE,
            address: mockAccount2,
          },
        },
      },
    })

    const mockRoute = {
      name: Screens.TransactionReview as Screens.TransactionReview,
      key: '',
      params: {
        confirmationProps: {
          address: mockAccount,
          comment: 'Pay up!',
          amount: {
            value: '1.0',
            currencyCode: 'cUSD',
          },
          type: TokenTransactionType.Sent,
          e164PhoneNumber: mockE164NumberInvite,
        },
        reviewProps: {
          timestamp: Date.now(),
          type: TokenTransactionType.Sent,
          header: 'Payment Send',
        },
      },
    }

    const tree = render(
      <Provider store={store}>
        <TransactionReview navigation={mockNavigation} route={mockRoute} />
      </Provider>
    )

    expect(tree.queryByTestId('transferAddressChanged')).toBeTruthy()
  })
})
