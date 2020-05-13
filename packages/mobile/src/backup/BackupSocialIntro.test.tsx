import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import BackupSocialIntro from 'src/backup/BackupSocialIntro'
import { Screens } from 'src/navigator/Screens'
import { createMockStore } from 'test/utils'
import { mockNavigation } from 'test/values'

describe('BackupSocialIntro', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <BackupSocialIntro
          navigation={mockNavigation}
          route={{
            name: Screens.BackupSocialIntro as Screens.BackupSocialIntro,
            key: '1',
            params: {},
          }}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
