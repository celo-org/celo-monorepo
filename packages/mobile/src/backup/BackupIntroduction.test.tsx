import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import BackupIntroduction from 'src/backup/BackupIntroduction'

it('renders correctly', () => {
  const tree = renderer.create(<BackupIntroduction onPress={jest.fn()} onCancel={jest.fn()} />)
  expect(tree).toMatchSnapshot()
})
