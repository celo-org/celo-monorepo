import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import { Backup } from 'src/backup/Backup'

it('renders correctly', () => {
  const tree = renderer.create(
    <Backup
      language={'en'}
      setBackupCompleted={jest.fn()}
      enterBackupFlow={jest.fn()}
      exitBackupFlow={jest.fn()}
    />
  )
  expect(tree).toMatchSnapshot()
})
