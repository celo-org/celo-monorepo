import * as React from 'react'
import { fireEvent, render, waitForElement } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import BackupQuiz, { BackupQuiz as BackupQuizRaw } from 'src/backup/BackupQuiz'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockI18nProps, getMockStackScreenProps } from 'test/utils'
import { mockAccount, mockMnemonic } from 'test/values'

jest.mock('lodash', () => ({
  ...jest.requireActual('lodash'),
  shuffle: jest.fn((array) => array),
}))

jest.mock('src/backup/utils', () => ({
  ...jest.requireActual('src/backup/utils'),
  getStoredMnemonic: jest.fn(() => mockMnemonic),
}))

const mockScreenProps = getMockStackScreenProps(Screens.BackupQuiz)

describe('BackupQuiz', () => {
  const store = createMockStore()
  beforeEach(() => {
    // According to the react-native-testing-library docs, if we're using
    // fake timers, tests that use async/await will stall.
    jest.useRealTimers()
  })

  it('renders correctly', async () => {
    const { getByTestId, toJSON } = render(
      <Provider store={store}>
        <BackupQuiz {...mockScreenProps} />
      </Provider>
    )
    await waitForElement(() => getByTestId('selected-word-0'))
    expect(toJSON()).toMatchSnapshot()
  })

  describe('when word is pressed', () => {
    it('removes it from the options adds it to chosen words', async () => {
      const mockSetBackupCompleted = jest.fn()
      const { getByTestId, getByText } = render(
        <Provider store={store}>
          <BackupQuizRaw
            {...getMockStackScreenProps(Screens.BackupQuiz)}
            setBackupCompleted={mockSetBackupCompleted}
            showError={jest.fn()}
            account={mockAccount}
            {...getMockI18nProps()}
          />
        </Provider>
      )

      await waitForElement(() => getByTestId('selected-word-0'))

      expect(getByTestId('selected-word-0').props.children).toEqual(1)

      const words = mockMnemonic.split(' ')
      const firstWord = words[0]
      const secondWord = words[1]

      fireEvent.press(getByText(firstWord))

      await waitForElement(() =>
        getByTestId('selected-word-0').find((node) => node.props.children === firstWord)
      )

      expect(getByTestId('selected-word-0').props.children).toEqual(firstWord)

      expect(getByText(secondWord)).toBeTruthy()
    })
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
          account={mockAccount}
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
