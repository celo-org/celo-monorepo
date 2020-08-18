import * as React from 'react'
import 'react-native'
import * as Keychain from 'react-native-keychain'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import BackupPhrase from 'src/backup/BackupPhrase'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

it('renders correctly with backup not completed', () => {
  const tree = renderer.create(
    <Provider store={createMockStore()}>
      <BackupPhrase {...getMockStackScreenProps(Screens.BackupPhrase)} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})

it('renders correctly with backup completed', () => {
  const tree = renderer.create(
    <Provider store={createMockStore({ account: { backupCompleted: true } })}>
      <BackupPhrase {...getMockStackScreenProps(Screens.BackupPhrase)} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})

it('still renders when mnemonic doesnt show up', () => {
  const mockGetGenericPassword = Keychain.getGenericPassword as jest.Mock
  mockGetGenericPassword.mockResolvedValue(null)

  const tree = renderer.create(
    <Provider store={createMockStore({ account: { backupCompleted: true } })}>
      <BackupPhrase {...getMockStackScreenProps(Screens.BackupPhrase)} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})
