import * as React from 'react'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import ValidateRecipientAccount from 'src/send/ValidateRecipientAccount'
import { createMockNavigationProp2, createMockStore } from 'test/utils'
import { mockTransactionData } from 'test/values'

const store = createMockStore()

describe('ValidateRecipientAccount', () => {
  it('renders correctly when full validation required', () => {
    const navigation = createMockNavigationProp2({
      transactionData: mockTransactionData,
      fullValidationRequired: true,
      isPaymentRequest: false,
    })

    const tree = render(
      <Provider store={store}>
        <ValidateRecipientAccount navigation={navigation} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly when partial validation required', () => {
    const navigation = createMockNavigationProp2({
      transactionData: mockTransactionData,
      fullValidationRequired: false,
      isPaymentRequest: false,
    })

    const tree = render(
      <Provider store={store}>
        <ValidateRecipientAccount navigation={navigation} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
