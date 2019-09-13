import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import BackupPhrase from 'src/backup/BackupPhrase'
import { createMockStore } from 'test/utils'

jest.mock('react-native-secure-key-store', () => {
  const SAMPLE_PHRASE =
    'prosper winner find donate tape history measure umbrella agent patrol want rhythm old unable wash wrong need fluid hammer coach reveal plastic trust lake'

  return {
    get: () => {
      return SAMPLE_PHRASE
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
