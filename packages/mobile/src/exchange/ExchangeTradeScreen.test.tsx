import * as React from 'react'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { ErrorMessages } from 'src/app/ErrorMessages'
import ExchangeTradeScreenConnected, { ExchangeTradeScreen } from 'src/exchange/ExchangeTradeScreen'
import { ExchangeRatePair } from 'src/exchange/reducer'
import { createMockStore, getMockI18nProps } from 'test/utils'

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

jest.mock('src/web3/contracts', () => ({
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

const store = createMockStore({
  exchange: {
    exchangeRatePair,
  },
  goldToken: {
    balance: '100',
  },
  stableToken: {
    balance: '200',
  },
})

describe(ExchangeTradeScreen, () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={store}>
        <ExchangeTradeScreenConnected />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  describe('methods:', () => {
    it('setExchangeAmount updates Errors', () => {
      const mockShowError = jest.fn()
      const mockhideAlert = jest.fn()
      const component = renderer.create(
        <ExchangeTradeScreen
          dollarBalance={'100'}
          goldBalance={'200'}
          error={null}
          fetchExchangeRate={jest.fn()}
          showError={mockShowError}
          hideAlert={mockhideAlert}
          exchangeRatePair={exchangeRatePair}
          {...getMockI18nProps()}
        />
      )

      component.root.instance.onChangeExchangeAmount('500')
      expect(mockShowError).toBeCalledWith(ErrorMessages.NSF_DOLLARS)
      component.root.instance.onPressSwapIcon()
      expect(mockShowError).toBeCalledWith(ErrorMessages.NSF_GOLD)
      component.root.instance.onChangeExchangeAmount('5')
      expect(mockhideAlert).toBeCalled()
    })

    it.only('validates amount', () => {
      const component = renderer.create(
        <ExchangeTradeScreen
          dollarBalance={'1'}
          goldBalance={'0.5'}
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
