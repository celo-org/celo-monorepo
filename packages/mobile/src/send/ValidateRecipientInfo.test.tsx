import * as React from 'react'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import ValidateRecipientIntro from 'src/send/ValidateRecipientIntro'
import { createMockNavigationProp, createMockStore } from 'test/utils'
import { mockTransactionData } from 'test/values'

const navigation = createMockNavigationProp({
  transactionData: mockTransactionData,
  fullValidationRequired: true,
  isPaymentRequest: false,
})
const store = createMockStore()

describe('ValidateRecipientIntro', () => {
  it('renders correctly', () => {
    const tree = render(
      <Provider store={store}>
        <ValidateRecipientIntro navigation={navigation} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('navigates to account confirmation screen when Confirm Account button clicked', () => {
    const tree = render(
      <Provider store={store}>
        <ValidateRecipientIntro navigation={navigation} />
      </Provider>
    )
    fireEvent.press(tree.getByTestId('confirmAccountButton'))
    expect(navigate).toHaveBeenCalledWith(Screens.ValidateRecipientAccount, {
      transactionData: mockTransactionData,
      fullValidationRequired: true,
      isPaymentRequest: false,
    })
  })

  it('navigates to QR Scanner screen when Scan QR Code button clicked', () => {
    const tree = render(
      <Provider store={store}>
        <ValidateRecipientIntro navigation={navigation} />
      </Provider>
    )
    fireEvent.press(tree.getByTestId('scanQRCode'))
    expect(navigate).toHaveBeenCalledWith(Screens.QRScanner, {
      transactionData: mockTransactionData,
      scanIsForSecureSend: true,
    })
  })
})
