import { shallow } from 'enzyme'
import * as React from 'react'
import * as renderer from 'react-test-renderer'
import { BackupPrompt } from 'src/shared/BackupPrompt'
import { getMockI18nProps } from 'test/utils'

const time = 1552353116086

jest.mock('src/web3/contracts', () => ({
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

describe('BackupPrompt', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <BackupPrompt
        accountCreationTime={time}
        backupCompleted={false}
        backupTooLate={true}
        doingBackupFlow={false}
        {...getMockI18nProps()}
      />
    )
    expect(tree).toMatchSnapshot()
  })

  describe('when backupCompleted is true and doingBackupFlow is false', () => {
    it('doesnt render visible stuff', () => {
      const wrapper = shallow(
        <BackupPrompt
          accountCreationTime={time}
          backupCompleted={true}
          backupTooLate={false}
          doingBackupFlow={false}
          {...getMockI18nProps()}
        />
      )
      expect(wrapper.find('TopAlert').prop('visible')).toEqual(false)
    })
  })

  describe('when backupCompleted is false', () => {
    it('renders visible', () => {
      const wrapper = shallow(
        <BackupPrompt
          accountCreationTime={time}
          backupCompleted={false}
          backupTooLate={true}
          doingBackupFlow={false}
          {...getMockI18nProps()}
        />
      )
      expect(wrapper.find('TopAlert').prop('visible')).toEqual(true)
    })
  })

  describe('when backupCompleted changes', () => {
    const wrapper = shallow(
      <BackupPrompt
        accountCreationTime={time}
        backupCompleted={false}
        backupTooLate={true}
        doingBackupFlow={false}
        {...getMockI18nProps()}
      />
    )
    wrapper.setProps({ backupCompleted: true, backupTooLate: false })
    expect(wrapper.find('TopAlert').prop('visible')).toEqual(false)
  })

  describe('when doingBackupFlow changes', () => {
    const wrapper = shallow(
      <BackupPrompt
        accountCreationTime={time}
        backupCompleted={false}
        backupTooLate={true}
        doingBackupFlow={false}
        {...getMockI18nProps()}
      />
    )
    expect(wrapper.find('TopAlert').prop('visible')).toEqual(true)
    wrapper.setProps({ doingBackupFlow: true })
    expect(wrapper.find('TopAlert').prop('visible')).toEqual(false)
  })
})
