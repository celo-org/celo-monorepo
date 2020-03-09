import * as React from 'react'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { ExchangeTradeScreen } from 'src/exchange/ExchangeTradeScreen'
import { ExchangeRatePair } from 'src/exchange/reducer'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { createMockNavigationProp, createMockStore, getMockI18nProps } from 'test/utils'

const exchangeRatePair: ExchangeRatePair = { goldMaker: '0.11', dollarMaker: '10' }

const store = createMockStore({
  exchange: {
    exchangeRatePair,
  },
})

describe(ExchangeTradeScreen, () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly', () => {
    const navigation = createMockNavigationProp({
      makerToken: CURRENCY_ENUM.GOLD,
      makerTokenBalance: '20',
    })
    const { toJSON } = render(
      <Provider store={store}>
        <ExchangeTradeScreen
          navigation={navigation}
          error={null}
          fetchExchangeRate={jest.fn()}
          showError={jest.fn()}
          hideAlert={jest.fn()}
          exchangeRatePair={exchangeRatePair}
          localCurrencyCode={LocalCurrencyCode.MXN}
          localCurrencyExchangeRate="20"
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
  })

  it('validates the amount when selling gold', () => {
    const mockShowError = jest.fn()
    const mockhideAlert = jest.fn()
    const navigation = createMockNavigationProp({
      makerToken: CURRENCY_ENUM.GOLD,
      makerTokenBalance: '20',
    })
    const { getByTestId } = render(
      <Provider store={store}>
        <ExchangeTradeScreen
          navigation={navigation}
          error={null}
          fetchExchangeRate={jest.fn()}
          showError={mockShowError}
          hideAlert={mockhideAlert}
          exchangeRatePair={exchangeRatePair}
          localCurrencyCode={LocalCurrencyCode.MXN}
          localCurrencyExchangeRate="20"
          {...getMockI18nProps()}
        />
      </Provider>
    )

    fireEvent.changeText(getByTestId('ExchangeInput'), '50')
    expect(mockShowError).toBeCalledWith(ErrorMessages.NSF_GOLD) // Can't afford 50 gold
    expect(getByTestId('ExchangeReviewButton').props.disabled).toBe(true)

    jest.clearAllMocks()
    fireEvent.press(getByTestId('ExchangeSwitchInput')) // Input is now in MXN
    expect(mockhideAlert).toBeCalled() // Can afford 50 MXN (2.50 cUSD) worth of gold
    expect(getByTestId('ExchangeReviewButton').props.disabled).toBe(false)

    jest.clearAllMocks()
    fireEvent.changeText(getByTestId('ExchangeInput'), '10000')
    expect(mockShowError).toBeCalledWith(ErrorMessages.NSF_GOLD) // Can't afford 10000 MXN (500 cUSD) worth of gold
    expect(getByTestId('ExchangeReviewButton').props.disabled).toBe(true)
  })

  it('validates the amount when selling dollars', () => {
    const mockShowError = jest.fn()
    const mockhideAlert = jest.fn()
    const navigation = createMockNavigationProp({
      makerToken: CURRENCY_ENUM.DOLLAR,
      makerTokenBalance: '20.02', // equals 400.4 MXN
    })
    const { getByTestId } = render(
      <Provider store={store}>
        <ExchangeTradeScreen
          navigation={navigation}
          error={null}
          fetchExchangeRate={jest.fn()}
          showError={mockShowError}
          hideAlert={mockhideAlert}
          exchangeRatePair={exchangeRatePair}
          localCurrencyCode={LocalCurrencyCode.MXN}
          localCurrencyExchangeRate="20"
          {...getMockI18nProps()}
        />
      </Provider>
    )

    fireEvent.changeText(getByTestId('ExchangeInput'), '10')
    expect(mockShowError).toBeCalledWith(ErrorMessages.NSF_DOLLARS) // Can't afford 10 gold
    expect(getByTestId('ExchangeReviewButton').props.disabled).toBe(true)

    jest.clearAllMocks()
    fireEvent.press(getByTestId('ExchangeSwitchInput')) // Input is now in MXN
    expect(mockhideAlert).toBeCalled() // Can afford 10 MXN (0.5 cUSD) worth of gold
    expect(getByTestId('ExchangeReviewButton').props.disabled).toBe(false)

    jest.clearAllMocks()
    fireEvent.changeText(getByTestId('ExchangeInput'), '401')
    expect(mockShowError).toBeCalledWith(ErrorMessages.NSF_DOLLARS) // Can't afford 400 MXN (20.05 cUSD) worth of gold
    expect(getByTestId('ExchangeReviewButton').props.disabled).toBe(true)
  })

  it('checks the minimum amount when selling gold', () => {
    const navigation = createMockNavigationProp({
      makerToken: CURRENCY_ENUM.GOLD,
      makerTokenBalance: '20',
    })
    const { getByTestId } = render(
      <Provider store={store}>
        <ExchangeTradeScreen
          navigation={navigation}
          error={null}
          fetchExchangeRate={jest.fn()}
          showError={jest.fn()}
          hideAlert={jest.fn()}
          exchangeRatePair={exchangeRatePair}
          localCurrencyCode={LocalCurrencyCode.USD}
          localCurrencyExchangeRate="1"
          {...getMockI18nProps()}
        />
      </Provider>
    )

    fireEvent.changeText(getByTestId('ExchangeInput'), '500')
    expect(getByTestId('ExchangeReviewButton').props.disabled).toBe(true)

    fireEvent.changeText(getByTestId('ExchangeInput'), '0.0001')
    expect(getByTestId('ExchangeReviewButton').props.disabled).toBe(true)

    // This is the minimum amount when exchanging gold (see GOLD_TRANSACTION_MIN_AMOUNT)
    // 0.001 is the actual minimum but when exchanging 0.001 at 0.11 rate it gives ~0.009 cUSD
    // which is 0 when rounded to the 2 decimals we support for cUSD
    fireEvent.changeText(getByTestId('ExchangeInput'), '0.002')
    expect(getByTestId('ExchangeReviewButton').props.disabled).toBe(false)
  })

  it('checks the minimum amount when selling dollars', () => {
    const navigation = createMockNavigationProp({
      makerToken: CURRENCY_ENUM.DOLLAR,
      makerTokenBalance: '200',
    })
    const { getByTestId } = render(
      <Provider store={store}>
        <ExchangeTradeScreen
          navigation={navigation}
          error={null}
          fetchExchangeRate={jest.fn()}
          showError={jest.fn()}
          hideAlert={jest.fn()}
          exchangeRatePair={exchangeRatePair}
          localCurrencyCode={LocalCurrencyCode.USD}
          localCurrencyExchangeRate="1"
          {...getMockI18nProps()}
        />
      </Provider>
    )

    fireEvent.changeText(getByTestId('ExchangeInput'), '500')
    expect(getByTestId('ExchangeReviewButton').props.disabled).toBe(true)

    fireEvent.changeText(getByTestId('ExchangeInput'), '0.001')
    expect(getByTestId('ExchangeReviewButton').props.disabled).toBe(true)

    // This is the minimum amount when exchanging dollars (see DOLLAR_TRANSACTION_MIN_AMOUNT)
    fireEvent.changeText(getByTestId('ExchangeInput'), '0.01')
    expect(getByTestId('ExchangeReviewButton').props.disabled).toBe(false)
  })
})
