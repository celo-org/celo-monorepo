import * as React from 'react'
import 'react-native'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import ImportWalletEmpty from 'src/import/ImportWalletEmpty'
import { Screens } from 'src/navigator/Screens'
import { createMockStore } from 'test/utils'
import { mockMnemonic, mockNavigation } from 'test/values'

describe('ImportWalletEmpty', () => {
  it('renders correctly', () => {
    const wrapper = render(
      <Provider store={createMockStore()}>
        <ImportWalletEmpty
          navigation={mockNavigation}
          route={{
            name: Screens.ImportWalletEmpty as Screens.ImportWalletEmpty,
            key: '1',
            params: {
              backupPhrase: mockMnemonic,
            },
          }}
        />
      </Provider>
    )

    expect(wrapper.toJSON()).toMatchSnapshot()
  })
})
