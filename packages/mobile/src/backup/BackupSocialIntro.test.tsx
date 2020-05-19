import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import BackupSocialIntro from 'src/backup/BackupSocialIntro'
import { createMockNavigationProp, createMockStore } from 'test/utils'

describe('BackupSocialIntro', () => {
  it('renders correctly', () => {
    const navigation = createMockNavigationProp(false)
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <BackupSocialIntro navigation={navigation} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
