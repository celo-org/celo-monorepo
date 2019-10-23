import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import BackupPhrase from 'src/backup/BackupPhrase'
import { createMockStore } from 'test/utils'
import { mockMnemonic } from 'test/values'

jest.mock('react-native-secure-key-store', () => {
  return {
    get: () => {
      return mockMnemonic
    },
  }
})

it('renders correctly with backup not completed', () => {
  const tree = renderer.create(
    <Provider store={createMockStore()}>
      <BackupPhrase />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})

it('renders correctly with backup completed', () => {
  const tree = renderer.create(
    <Provider store={createMockStore({ account: { backupCompleted: true } })}>
      <BackupPhrase />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})
