import * as React from 'react'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { ExchangeTradeScreen } from 'src/exchange/ExchangeTradeScreen'
import { ExchangeRatePair } from 'src/exchange/reducer'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { createMockNavigationProp, createMockStore, getMockI18nProps } from 'test/utils'

const exchangeRatePair: ExchangeRatePair = { goldMaker: '0.11', dollarMaker: '10' }

// This mocks the default and named exports for DisconnectBanner
// Which is necessary because one of the tests below doesn't work when
// we render the component using the mockStore, meaning we need to mock
// children that connect to the store
jest.mock('src/shared/DisconnectBanner', () => ({
  __esModule: true,
  default: () => null,
  DisconnectBanner: () => null,
}))

const store = createMockStore({
  exchange: {
    exchangeRatePair,
  },
})

describe(ExchangeTradeScreen, () => {
  it('renders correctly', () => {
    const navigation = createMockNavigationProp({
      makerToken: CURRENCY_ENUM.GOLD,
      makerTokenBalance: '20',
    })
    const tree = renderer.create(
      <Provider store={store}>
        <ExchangeTradeScreen
          navigation={navigation}
          error={null}
          fetchExchangeRate={jest.fn()}
          showError={jest.fn()}
          hideAlert={jest.fn()}
          exchangeRatePair={exchangeRatePair}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  describe('methods:', () => {
    it('setExchangeAmount updates Errors selling gold', () => {
      const mockShowError = jest.fn()
      const mockhideAlert = jest.fn()
      const navigation = createMockNavigationProp({
        makerToken: CURRENCY_ENUM.GOLD,
        makerTokenBalance: '20',
      })
      const component = renderer.create(
        <ExchangeTradeScreen
          navigation={navigation}
          error={null}
          fetchExchangeRate={jest.fn()}
          showError={mockShowError}
          hideAlert={mockhideAlert}
          exchangeRatePair={exchangeRatePair}
          {...getMockI18nProps()}
        />
      )
      component.root.instance.onChangeExchangeAmount('50')
      expect(mockShowError).toBeCalledWith(ErrorMessages.NSF_GOLD) // Can't afford 50 gold
      component.root.instance.switchInputToken()
      expect(mockhideAlert).toBeCalled() // Can afford 50 cUSD worth of gold
      component.root.instance.onChangeExchangeAmount('1000')
      expect(mockShowError).toBeCalledWith(ErrorMessages.NSF_GOLD) // Can't afford 1000 cUSD worth of gold
    })

    it('setExchangeAmount updates Errors selling dollars', () => {
      const mockShowError = jest.fn()
      const mockhideAlert = jest.fn()
      const navigation = createMockNavigationProp({
        makerToken: CURRENCY_ENUM.DOLLAR,
        makerTokenBalance: '20.02',
      })
      const component = renderer.create(
        <ExchangeTradeScreen
          navigation={navigation}
          error={null}
          fetchExchangeRate={jest.fn()}
          showError={mockShowError}
          hideAlert={mockhideAlert}
          exchangeRatePair={exchangeRatePair}
          {...getMockI18nProps()}
        />
      )
      component.root.instance.onChangeExchangeAmount('10')
      expect(mockShowError).toBeCalledWith(ErrorMessages.NSF_DOLLARS) // Can't afford 10 gold
      component.root.instance.switchInputToken()
      expect(mockhideAlert).toBeCalled() // Can afford 10 USD worth of gold
      component.root.instance.onChangeExchangeAmount('20')
      expect(mockShowError).toBeCalledWith(ErrorMessages.NSF_DOLLARS) // Can't afford 20 cUSD worth of gold
    })

    it('validates amount', () => {
      const navigation = createMockNavigationProp({
        makerToken: CURRENCY_ENUM.DOLLAR,
        makerTokenBalance: '200',
      })
      const component = renderer.create(
        <ExchangeTradeScreen
          navigation={navigation}
          error={null}
          fetchExchangeRate={jest.fn()}
          showError={jest.fn()}
          hideAlert={jest.fn()}
          exchangeRatePair={exchangeRatePair}
          {...getMockI18nProps()}
        />
      )

      component.root.instance.onChangeExchangeAmount('500')
      expect(component.root.instance.isExchangeInvalid()).toBe(true)
      component.root.instance.onChangeExchangeAmount('0.0001')
      expect(component.root.instance.isExchangeInvalid()).toBe(true)
      component.root.instance.onChangeExchangeAmount('0.01')
      expect(component.root.instance.isExchangeInvalid()).toBe(false)
    })
  })
})
