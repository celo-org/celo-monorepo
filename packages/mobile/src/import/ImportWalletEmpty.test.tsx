import * as React from 'react'
import 'react-native'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import ImportWalletEmpty from 'src/import/ImportWalletEmpty'
import { createMockNavigationProp, createMockStore } from 'test/utils'
import { mockMnemonic } from 'test/values'

describe('ImportWalletEmpty', () => {
  it('renders correctly', () => {
    const navigation = createMockNavigationProp(mockMnemonic)
    const wrapper = render(
      <Provider store={createMockStore()}>
        <ImportWalletEmpty navigation={navigation} />
      </Provider>
    )

    expect(wrapper.toJSON()).toMatchSnapshot()
  })
})
