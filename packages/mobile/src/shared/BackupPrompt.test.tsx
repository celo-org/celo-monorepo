import * as React from 'react'
import { render } from 'react-native-testing-library'
import { BackupPrompt } from 'src/shared/BackupPrompt'
import { getMockI18nProps } from 'test/utils'

const time = 1552353116086

describe('BackupPrompt', () => {
  it('renders correctly', () => {
    const { toJSON } = render(
      <BackupPrompt
        accountCreationTime={time}
        backupCompleted={false}
        backupTooLate={true}
        doingBackupFlow={false}
        {...getMockI18nProps()}
      />
    )
    expect(toJSON()).toMatchSnapshot()
  })

  describe('when backupCompleted is true and doingBackupFlow is false', () => {
    it("doesn't render visible stuff", () => {
      const { queryByText } = render(
        <BackupPrompt
          accountCreationTime={time}
          backupCompleted={true}
          backupTooLate={false}
          doingBackupFlow={false}
          {...getMockI18nProps()}
        />
      )
      expect(queryByText('backupPrompt')).toBeNull()
    })
  })

  describe('when backupCompleted is false', () => {
    it('renders visible', () => {
      const { queryByText } = render(
        <BackupPrompt
          accountCreationTime={time}
          backupCompleted={false}
          backupTooLate={true}
          doingBackupFlow={false}
          {...getMockI18nProps()}
        />
      )
      expect(queryByText('backupPrompt')).not.toBeNull()
    })
  })

  describe('when backupCompleted changes', () => {
    it('renders correctly', () => {
      const initialProps = {
        ...getMockI18nProps(),
        accountCreationTime: time,
        doingBackupFlow: false,
      }
      const { update } = render(
        <BackupPrompt {...initialProps} backupCompleted={false} backupTooLate={true} />
      )
      update(<BackupPrompt {...initialProps} backupCompleted={true} backupTooLate={false} />)
      // TODO fix and re-enable, this causes the test to run out of memory and crash
      // expect(queryByText('backupPrompt')).toBeNull()
    })
  })

  describe('when doingBackupFlow changes', () => {
    it('renders correctly', () => {
      const initialProps = {
        ...getMockI18nProps(),
        accountCreationTime: time,
        backupCompleted: false,
        backupTooLate: true,
      }

      const { update, queryByText } = render(
        <BackupPrompt {...initialProps} doingBackupFlow={false} />
      )
      expect(queryByText('backupPrompt')).not.toBeNull()
      update(<BackupPrompt {...initialProps} doingBackupFlow={true} />)
      // TODO fix and re-enable, this causes the test to run out of memory and crash
      // expect(queryByText('backupPrompt')).toBeNull()
    })
  })
})
