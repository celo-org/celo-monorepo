import * as React from 'react'
import 'react-native'
import { render } from 'react-native-testing-library'
import CodeRow, { CodeRowStatus } from 'src/components/CodeRow'

describe('CodeRow', () => {
  it('renders correctly for all CodeRowStatus states', () => {
    ;[
      CodeRowStatus.DISABLED,
      CodeRowStatus.INPUTTING,
      CodeRowStatus.PROCESSING,
      CodeRowStatus.RECEIVED,
      CodeRowStatus.ACCEPTED,
    ].map((status) => {
      const { toJSON } = render(
        <CodeRow
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
