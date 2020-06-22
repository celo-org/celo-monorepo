import * as React from 'react'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import FiatExchangeAmount from 'src/fiatExchanges/FiatExchangeAmount'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

const mockScreenProps = (isAddFunds: boolean) =>
  getMockStackScreenProps(Screens.FiatExchangeAmount, {
    isAddFunds,
  })

describe('FiatExchangeAmount', () => {
  const store = createMockStore({
    stableToken: {
      balance: '1000.00',
    },
  })

  it('renders correctly', () => {
    const { toJSON } = render(
      <Provider store={store}>
        <FiatExchangeAmount {...mockScreenProps(true)} />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
  })

  it('validates the amount when cashing out', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <FiatExchangeAmount {...mockScreenProps(false)} />
      </Provider>
    )

    fireEvent.changeText(getByTestId('FiatExchangeInput'), '10')
    expect(getByTestId('FiatExchangeNextButton').props.disabled).toBe(false)
    fireEvent.changeText(getByTestId('FiatExchangeInput'), '0')
    expect(getByTestId('FiatExchangeNextButton').props.disabled).toBe(true)
    fireEvent.changeText(getByTestId('FiatExchangeInput'), '750')
    expect(getByTestId('FiatExchangeNextButton').props.disabled).toBe(false)
    fireEvent.press(getByTestId('FiatExchangeNextButton'))
    expect(store.getActions()).toContainEqual(showError(ErrorMessages.PAYMENT_LIMIT_REACHED, null))
  })

  it('validates the amount when adding funds', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <FiatExchangeAmount {...mockScreenProps(true)} />
      </Provider>
    )

    fireEvent.changeText(getByTestId('FiatExchangeInput'), '0')
    expect(getByTestId('FiatExchangeNextButton').props.disabled).toBe(true)
    fireEvent.changeText(getByTestId('FiatExchangeInput'), '10')
    expect(getByTestId('FiatExchangeNextButton').props.disabled).toBe(false)
    fireEvent.changeText(getByTestId('FiatExchangeInput'), '750')
    expect(getByTestId('FiatExchangeNextButton').props.disabled).toBe(false)
    fireEvent.press(getByTestId('FiatExchangeNextButton'))
    expect(store.getActions()).toContainEqual(showError(ErrorMessages.PAYMENT_LIMIT_REACHED, null))
  })
})
