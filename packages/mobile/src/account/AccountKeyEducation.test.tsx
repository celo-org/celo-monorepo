import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import AccountKeyEducation from 'src/account/AccountKeyEducation'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

const mockScreenProps = getMockStackScreenProps(Screens.AccountKeyEducation)

describe('AccountKeyEducation', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <AccountKeyEducation {...mockScreenProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
