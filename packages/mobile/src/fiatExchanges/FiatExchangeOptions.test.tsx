import BigNumber from 'bignumber.js'
import * as React from 'react'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import FiatExchangeOptions from 'src/fiatExchanges/FiatExchangeOptions'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

const mockScreenProps = (isAddFunds: boolean) =>
  getMockStackScreenProps(Screens.FiatExchangeOptions, {
    isAddFunds,
    amount: new BigNumber('1'),
  })

describe('FiatExchangeOptions', () => {
  it('renders correctly', () => {
    const { toJSON } = render(
      <Provider store={createMockStore({})}>
        <FiatExchangeOptions {...mockScreenProps(true)} />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
  })
})
