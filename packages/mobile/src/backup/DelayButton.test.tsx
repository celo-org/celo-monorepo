import * as React from 'react'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import DelayButton from 'src/backup/DelayButton'
import { createMockStore } from 'test/utils'
const NOW = new Date().getTime()

const TWO_DAYS = 60 * 60 * 24 * 2 * 1000

describe('DelayButton', () => {
  it('renders button with text when backup too late and not delayed', () => {
    const { toJSON, queryByText, debug } = render(
      <Provider
        store={createMockStore({
          account: {
            accountCreationTime: NOW - TWO_DAYS,
            backupCompleted: false,
            backupDelayedTime: 0,
          },
        })}
      >
        <DelayButton />
      </Provider>
    )
    debug()
    expect(queryByText('delayBackup')).toBeTruthy()
    expect(toJSON()).toMatchSnapshot()
  })

  it('renders empty when backup too late and delayed', () => {
    const { toJSON, queryByText } = render(
      <Provider
        store={createMockStore({
          account: {
            accountCreationTime: NOW - TWO_DAYS,
            backupDelayedTime: NOW,
            backupCompleted: false,
          },
        })}
      >
        <DelayButton />
      </Provider>
    )
    expect(queryByText('delayBackup')).toBeFalsy()
    expect(toJSON()).toMatchSnapshot()
  })
})
