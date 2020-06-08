import * as React from 'react'
import 'react-native'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import ImportWalletEmpty from 'src/import/ImportWalletEmpty'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockMnemonic } from 'test/values'

const mockScreenProps = getMockStackScreenProps(Screens.ImportWalletEmpty, {
  backupPhrase: mockMnemonic,
})

describe('ImportWalletEmpty', () => {
  it('renders correctly', () => {
    const wrapper = render(
      <Provider store={createMockStore()}>
        <ImportWalletEmpty {...mockScreenProps} />
      </Provider>
    )

    expect(wrapper.toJSON()).toMatchSnapshot()
  })
})
