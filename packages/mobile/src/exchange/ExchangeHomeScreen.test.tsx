// need to mock this as it expects to be called inside a provider
jest.mock('src/components/AccountOverview', () => ({ default: () => 'AccountOverviewComponent' }))
// import * as React from 'react'
// import { MockedProvider } from 'react-apollo/test-utils'
import 'react-native'
// import { Provider } from 'react-redux'
// import * as renderer from 'react-test-renderer'
// import configureMockStore from 'redux-mock-store'
// import thunk from 'redux-thunk'
// import { ExchangeHomeScreen } from 'src/exchange/ExchangeHomeScreen'
// import { transactionQuery } from 'src/home/WalletHome'
// import i18n from 'src/i18n'

// const middlewares = [thunk]
// const mockStore = configureMockStore(middlewares)

// const newDollarBalance = '189.9'
// const newGoldBalance = '207.81'
// const exchangeRate = '2'

// const mocks = [
//   {
//     request: {
//       query: transactionQuery,
//       variables: {
//         address: '',
//       },
//     },
//     result: {
//       data: {
//         events: [],
//       },
//     },
//   },
// ]

// failing due to various apollo issues with mocks
xit('renders correctly', () => {
  // const store = mockStore({
  //   account: { devModeActive: false },
  //   transactions: { standbyTransactions: [] },
  //   web3: { accounts: {} },
  // })
  // const tree = renderer.create(
  //   <Provider store={store}>
  //     <MockedProvider mocks={mocks} addTypename={false}>
  //       <ExchangeHomeScreen
  //         dollarBalance={newDollarBalance}
  //         goldBalance={newGoldBalance}
  //         dollarPending={0}
  //         goldPending={0}
  //         fetchExchangeRate={jest.fn()}
  //         exchangeRate={exchangeRate}
  //         fetchGoldPendingBalance={jest.fn()}
  //         fetchDollarBalance={jest.fn()}
  //         fetchDollarPendingBalance={jest.fn()}
  //         fetchGoldBalance={jest.fn()}
  //         tReady={true}
  //         i18n={i18n}
  //         t={i18n.t}
  //       />
  //     </MockedProvider>
  //   </Provider>
  // )
  // expect(tree).toMatchSnapshot()
})
