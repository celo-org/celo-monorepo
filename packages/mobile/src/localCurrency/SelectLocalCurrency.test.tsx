import * as React from 'react'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import SelectLocalCurrency from 'src/localCurrency/SelectLocalCurrency'
import { createMockStore } from 'test/utils'

describe('SelectLocalCurrency', () => {
  it('renders correctly', () => {
    const { toJSON } = render(
      <Provider store={createMockStore()}>
        <SelectLocalCurrency />
      </Provider>
    )

    expect(toJSON()).toMatchSnapshot()
  })
})
