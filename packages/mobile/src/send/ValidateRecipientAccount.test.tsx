import * as React from 'react'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { AddressValidationType } from 'src/identity/reducer'
import { Screens } from 'src/navigator/Screens'
import ValidateRecipientAccount from 'src/send/ValidateRecipientAccount'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockTransactionData } from 'test/values'

const store = createMockStore()

describe('ValidateRecipientAccount', () => {
  it('renders correctly when full validation required', () => {
    const tree = render(
      <Provider store={store}>
        <ValidateRecipientAccount
          {...getMockStackScreenProps(Screens.ValidateRecipientAccount, {
            transactionData: mockTransactionData,
            addressValidationType: AddressValidationType.FULL,
          })}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly when partial validation required', () => {
    const tree = render(
      <Provider store={store}>
        <ValidateRecipientAccount
          {...getMockStackScreenProps(Screens.ValidateRecipientAccount, {
            transactionData: mockTransactionData,
            addressValidationType: AddressValidationType.PARTIAL,
          })}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
