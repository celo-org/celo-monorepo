import * as React from 'react'
import 'react-native'
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
})
