import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import BackupComplete from 'src/backup/BackupComplete'

it('renders correctly', () => {
  const tree = renderer.create(<BackupComplete mnemonic={'foo bar'} onPress={jest.fn()} />)
  expect(tree).toMatchSnapshot()
})
