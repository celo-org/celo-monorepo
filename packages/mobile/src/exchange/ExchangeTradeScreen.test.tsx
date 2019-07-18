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
      // const { component, mockShowError, mockhideAlert } = setup()
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

      component.root.instance.setExchangeAmount('500')
      expect(mockShowError).toBeCalledWith(ErrorMessages.NSF_DOLLARS, 5000)
      component.root.instance.switchTokens()
      expect(mockShowError).toBeCalledWith(ErrorMessages.NSF_GOLD, 5000)
      component.root.instance.setExchangeAmount('5')
      expect(mockhideAlert).toBeCalled()
    })
  })
})
