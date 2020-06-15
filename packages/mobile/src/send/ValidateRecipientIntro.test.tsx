import * as React from 'react'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { AddressValidationType } from 'src/identity/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import ValidateRecipientIntro from 'src/send/ValidateRecipientIntro'
import { createMockStore } from 'test/utils'
import { mockNavigation, mockTransactionData } from 'test/values'

const store = createMockStore()

const mockRoute = {
  name: Screens.ValidateRecipientIntro as Screens.ValidateRecipientIntro,
  key: '1',
  params: {
    transactionData: mockTransactionData,
    addressValidationType: AddressValidationType.FULL,
  },
}

describe('ValidateRecipientIntro', () => {
  it('renders correctly', () => {
    const tree = render(
      <Provider store={store}>
        <ValidateRecipientIntro navigation={mockNavigation} route={mockRoute} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('navigates to account confirmation screen when Confirm Account button clicked', () => {
    const tree = render(
      <Provider store={store}>
        <ValidateRecipientIntro navigation={mockNavigation} route={mockRoute} />
      </Provider>
    )
    fireEvent.press(tree.getByTestId('confirmAccountButton'))
    expect(navigate).toHaveBeenCalledWith(Screens.ValidateRecipientAccount, {
      transactionData: mockTransactionData,
      addressValidationType: AddressValidationType.FULL,
    })
  })

  it('navigates to QR Scanner screen when Scan QR Code button clicked', () => {
    const tree = render(
      <Provider store={store}>
        <ValidateRecipientIntro navigation={mockNavigation} route={mockRoute} />
      </Provider>
    )
    fireEvent.press(tree.getByTestId('scanQRCode'))
    expect(navigate).toHaveBeenCalledWith(Screens.QRNavigator, {
      screen: Screens.QRScanner,
      params: {
        transactionData: mockTransactionData,
        scanIsForSecureSend: true,
      },
    })
  })
})
