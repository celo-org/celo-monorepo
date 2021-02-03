import * as React from 'react'
import { TextInput } from 'react-native'
import { render } from 'react-native-testing-library'
import CodeInput, { CodeInputStatus } from 'src/components/CodeInput'

describe('CodeInput', () => {
  it('renders correctly for all CodeInputStatus states', () => {
    ;[
      CodeInputStatus.DISABLED,
      CodeInputStatus.INPUTTING,
      CodeInputStatus.PROCESSING,
      CodeInputStatus.RECEIVED,
      CodeInputStatus.ACCEPTED,
    ].map((status) => {
      const { toJSON } = render(
        <CodeInput
          label="label"
          status={status}
          inputValue={'test'}
          inputPlaceholder={'placeholder'}
          onInputChange={jest.fn()}
          shouldShowClipboard={jest.fn()}
        />
      )
      expect(toJSON()).toMatchSnapshot()
    })
  })

  it('disables auto correct / suggestion when in input mode', () => {
    const { getByType } = render(
      <CodeInput
        label="label"
        status={CodeInputStatus.INPUTTING}
        inputValue={'test'}
        inputPlaceholder={'placeholder'}
        onInputChange={jest.fn()}
        shouldShowClipboard={jest.fn()}
      />
    )

    expect(getByType(TextInput).props.autoCorrect).toBe(false)
    expect(getByType(TextInput).props.autoCapitalize).toBe('none')
    expect(getByType(TextInput).props.keyboardType).toBe('visible-password')
  })
})
