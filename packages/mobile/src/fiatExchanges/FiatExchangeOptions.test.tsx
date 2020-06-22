import BigNumber from 'bignumber.js'
import * as React from 'react'
import { render } from 'react-native-testing-library'
import FiatExchangeOptions from 'src/fiatExchanges/FiatExchangeOptions'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { Screens } from 'src/navigator/Screens'
import { getMockStackScreenProps } from 'test/utils'

const mockScreenProps = (isAddFunds: boolean) =>
  getMockStackScreenProps(Screens.FiatExchangeOptions, {
    isAddFunds,
    amount: new BigNumber('1'),
    currencyCode: LocalCurrencyCode.EUR,
  })

describe('FiatExchangeOptions', () => {
  it('renders correctly', () => {
    const { toJSON } = render(<FiatExchangeOptions {...mockScreenProps(true)} />)
    expect(toJSON()).toMatchSnapshot()
  })
})
