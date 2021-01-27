import * as React from 'react'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import DelayButton from 'src/backup/DelayButton'
import { createMockStore } from 'test/utils'

const TWO_DAYS = 60 * 60 * 24 * 2 * 1000

const mockCurrentTime = 1552353116086

jest.mock('src/utils/time', () => ({
  getRemoteTime: () => mockCurrentTime,
}))

describe('DelayButton', () => {
  it('renders button with text when backup not completed and not delayed yet', () => {
    const { toJSON, queryByText } = render(
      <Provider
        store={createMockStore({
          account: {
            backupRequiredTime: null,
            backupCompleted: false,
          },
        })}
      >
        <DelayButton />
      </Provider>
    )
    expect(queryByText('delayBackup')).toBeTruthy()
    expect(toJSON()).toMatchSnapshot()
  })

  it('renders empty when backup was already delayed', () => {
    const { queryByText } = render(
      <Provider
        store={createMockStore({
          account: {
            backupRequiredTime: mockCurrentTime + TWO_DAYS,
            backupCompleted: false,
          },
        })}
      >
        <DelayButton />
      </Provider>
    )
    expect(queryByText('delayBackup')).toBeFalsy()
  })

  it('renders empty when backup already completed', () => {
    const { queryByText } = render(
      <Provider
        store={createMockStore({
          account: {
            backupRequiredTime: null,
            backupCompleted: true,
          },
        })}
      >
        <DelayButton />
      </Provider>
    )
    expect(queryByText('delayBackup')).toBeFalsy()
  })
})
