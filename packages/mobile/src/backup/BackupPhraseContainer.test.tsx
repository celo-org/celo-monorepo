import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import BackupPhraseContainer, {
  BackupPhraseContainerMode,
  BackupPhraseType,
} from 'src/backup/BackupPhraseContainer'
import { mockMnemonic, mockMnemonicShard1 } from 'test/values'

describe(BackupPhraseContainer, () => {
  it('renders correctly for readonly backup phrase', () => {
    const tree = renderer.create(
      <BackupPhraseContainer
        value={mockMnemonic}
        mode={BackupPhraseContainerMode.READONLY}
        type={BackupPhraseType.BACKUP_KEY}
      />
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly for input backup phrase', () => {
    const tree = renderer.create(
      <BackupPhraseContainer
        value={mockMnemonic}
        mode={BackupPhraseContainerMode.INPUT}
        type={BackupPhraseType.BACKUP_KEY}
      />
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly for readonly social backup phrase', () => {
    const tree = renderer.create(
      <BackupPhraseContainer
        value={mockMnemonicShard1}
        mode={BackupPhraseContainerMode.READONLY}
        type={BackupPhraseType.SOCIAL_BACKUP}
      />
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly for input social backup phrase', () => {
    const tree = renderer.create(
      <BackupPhraseContainer
        value={mockMnemonicShard1}
        mode={BackupPhraseContainerMode.INPUT}
        type={BackupPhraseType.SOCIAL_BACKUP}
      />
    )
    expect(tree).toMatchSnapshot()
  })
})
