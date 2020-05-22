import * as React from 'react'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { AddressValidationType } from 'src/identity/reducer'
import { Screens } from 'src/navigator/Screens'
import ValidateRecipientAccount from 'src/send/ValidateRecipientAccount'
import { createMockStore } from 'test/utils'
import { mockNavigation, mockTransactionData } from 'test/values'

const store = createMockStore()

describe('ValidateRecipientAccount', () => {
  it('renders correctly when full validation required', () => {
    const mockRoute = {
      name: Screens.ValidateRecipientAccount as Screens.ValidateRecipientAccount,
      key: '1',
      params: {
        transactionData: mockTransactionData,
        addressValidationType: AddressValidationType.FULL,
      },
    }

    const tree = render(
      <Provider store={store}>
        <ValidateRecipientAccount navigation={mockNavigation} route={mockRoute} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly when partial validation required', () => {
    const mockRoute = {
      name: Screens.ValidateRecipientAccount as Screens.ValidateRecipientAccount,
      key: '1',
      params: {
        transactionData: mockTransactionData,
        addressValidationType: AddressValidationType.PARTIAL,
      },
    }

    const tree = render(
      <Provider store={store}>
        <ValidateRecipientAccount navigation={mockNavigation} route={mockRoute} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
