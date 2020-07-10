import * as React from 'react'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { ErrorDisplayType } from 'src/alert/reducer'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { AddressValidationType } from 'src/identity/reducer'
import { navigateBack, replace } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import AddressFetchLoading from 'src/send/AddressFetchLoading'
import { createMockStore } from 'test/utils'
import { mockE164NumberInvite, mockNavigation, mockTransactionData } from 'test/values'

const mockRoute = {
  name: Screens.AddressFetchLoading as Screens.AddressFetchLoading,
  key: '1',
  params: {
    transactionData: mockTransactionData,
  },
}

describe('AddressFetchLoading', () => {
  it('displays the loading animation while fetching addresses', () => {
    const store = createMockStore({
      identity: {
        isFetchingAddresses: true,
        secureSendPhoneNumberMapping: {},
      },
    })

    const tree = render(
      <Provider store={store}>
        <AddressFetchLoading navigation={mockNavigation} route={mockRoute} />
      </Provider>
    )
    expect(tree.queryByTestId('AddressFetchLoading')).not.toBeNull()
  })

  it('navigates back when there is an error fetching addresses', () => {
    const store = createMockStore({
      identity: {
        isFetchingAddresses: true,
        secureSendPhoneNumberMapping: {},
      },
    })

    const tree = render(
      <Provider store={store}>
        <AddressFetchLoading navigation={mockNavigation} route={mockRoute} />
      </Provider>
    )

    const updatedStore = createMockStore({
      identity: {
        isFetchingAddresses: false,
        secureSendPhoneNumberMapping: {},
      },
      alert: {
        buttonMessage: null,
        dismissAfter: 5000,
        displayMethod: ErrorDisplayType.BANNER,
        message: ErrorMessages.ADDRESS_LOOKUP_FAILURE,
        title: null,
        type: 'error',
        underlyingError: ErrorMessages.ADDRESS_LOOKUP_FAILURE,
      },
    })

    tree.rerender(
      <Provider store={updatedStore}>
        <AddressFetchLoading navigation={mockNavigation} route={mockRoute} />
      </Provider>
    )

    jest.runAllTimers()

    expect(navigateBack).toHaveBeenCalled()
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
        <AddressFetchLoading navigation={mockNavigation} route={mockRoute} />
      </Provider>
    )

    const updatedStore = createMockStore({
      identity: {
        isFetchingAddresses: false,
        secureSendPhoneNumberMapping: {
          [mockE164NumberInvite]: {
            addressValidationType: AddressValidationType.NONE,
          },
        },
      },
    })

    tree.rerender(
      <Provider store={updatedStore}>
        <AddressFetchLoading navigation={mockNavigation} route={mockRoute} />
      </Provider>
    )

    jest.runAllTimers()

    expect(replace).toHaveBeenCalledWith(Screens.SendConfirmation, {
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
        <AddressFetchLoading navigation={mockNavigation} route={mockRoute} />
      </Provider>
    )

    const updatedStore = createMockStore({
      identity: {
        isFetchingAddresses: false,
        secureSendPhoneNumberMapping: {
          [mockE164NumberInvite]: {
            addressValidationType: AddressValidationType.PARTIAL,
          },
        },
      },
    })

    tree.rerender(
      <Provider store={updatedStore}>
        <AddressFetchLoading navigation={mockNavigation} route={mockRoute} />
      </Provider>
    )

    jest.runAllTimers()

    expect(replace).toHaveBeenCalledWith(Screens.ValidateRecipientIntro, {
      transactionData: mockTransactionData,
      addressValidationType: AddressValidationType.PARTIAL,
    })
  })
})
