const { mockNavigationServiceFor } = require('test/utils')
const { navigateBack } = mockNavigationServiceFor('Education')

import * as React from 'react'
import 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import Education from 'src/account/Education'
import { CustomEventNames } from 'src/analytics/constants'
import { Screens } from 'src/navigator/Screens'
import { createMockStore } from 'test/utils'

const BUTTON_TEXT = 'Test'

const educationProps = {
  stepInfo: [
    {
      image: './test.jpg',
      text: 'Step 1',
      cancelEvent: CustomEventNames.photo_education_cancel1,
      screenName: Screens.Debug,
    },
  ],
  buttonText: BUTTON_TEXT,
  onFinish: jest.fn(),
}

jest.mock('src/web3/contracts', () => ({
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

describe('Education', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <Education {...educationProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('finishes when pressed', () => {
    const edu = render(<Education {...educationProps} />)
    fireEvent.press(edu.getByProps({ text: BUTTON_TEXT }))
    expect(educationProps.onFinish).toBeCalled()
  })

  it('navigates back', () => {
    const edu = render(<Education {...educationProps} />)
    fireEvent.press(edu.getByTestId('Education-goback'))
    expect(navigateBack).toBeCalled()
  })
})
