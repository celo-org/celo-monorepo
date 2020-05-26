import * as React from 'react'
import { fireEvent, render, waitForElement } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import BackupQuiz, { BackupQuiz as BackupQuizRaw } from 'src/backup/BackupQuiz'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockI18nProps, getMockStackScreenProps } from 'test/utils'
import { mockMnemonic } from 'test/values'

jest.mock('lodash', () => ({
  ...jest.requireActual('lodash'),
  shuffle: jest.fn((array) => array),
}))

const mockScreenProps = getMockStackScreenProps(Screens.BackupQuiz, { mnemonic: mockMnemonic })

describe('BackupQuiz', () => {
  const store = createMockStore()
  beforeEach(() => {
    // According to the react-native-testing-library docs, if we're using
    // fake timers, tests that use async/await will stall.
    jest.useRealTimers()
  })

  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={store}>
        <BackupQuiz {...mockScreenProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  /**
   * Note(Rossy): Unfortunately I have to skip this test for now.
   * The test must wait for buttons to be ready, and which takes
   * in total over 10 seconds for all 24 mnemonic words. Maybe the
   * test renderer perf will improve at some point and we can enable this.
   */
  it.skip('can complete the quiz correctly', async () => {
    const mockSetBackupCompleted = jest.fn()
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <BackupQuizRaw
          {...mockScreenProps}
          setBackupCompleted={mockSetBackupCompleted}
          showError={jest.fn()}
          {...getMockI18nProps()}
        />
      </Provider>
    )
    for (const word of mockMnemonic.split(' ')) {
      await waitForElement(() => getByText(word))
      fireEvent.press(getByText(word))
    }
    fireEvent.press(getByTestId('QuizSubmit'))
    expect(mockSetBackupCompleted).toHaveBeenCalled()
  })
})
