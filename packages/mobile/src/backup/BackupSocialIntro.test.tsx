import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import BackupSocialIntro from 'src/backup/BackupSocialIntro'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

describe('BackupSocialIntro', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <BackupSocialIntro
          {...getMockStackScreenProps(Screens.BackupSocialIntro, { incomingFromBackupFlow: true })}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
