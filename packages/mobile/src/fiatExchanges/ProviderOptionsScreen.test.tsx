import * as React from 'react'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import ProviderOptionsScreen from 'src/fiatExchanges/ProviderOptionsScreen'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

const mockScreenProps = (isCashIn: boolean) =>
  getMockStackScreenProps(Screens.ProviderOptionsScreen, {
    isCashIn,
  })

describe('ProviderOptionsScreen', () => {
  it('renders correctly', () => {
    const { toJSON } = render(
      <Provider store={createMockStore({})}>
        <ProviderOptionsScreen {...mockScreenProps(true)} />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
  })
})
