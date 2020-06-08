import * as React from 'react'
import 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import Education, { Props } from 'src/account/Education'
import { CustomEventNames } from 'src/analytics/constants'
import { navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore } from 'test/utils'

const BUTTON_TEXT = 'Done'

const educationProps: Props = {
  stepInfo: [
    {
      image: null,
      title: 'Step 1',
      text: 'The Journey Begins',
      cancelEvent: CustomEventNames.photo_education_cancel1,
      progressEvent: CustomEventNames.gold_educate_1_next,
      screenName: Screens.Debug,
    },
  ],
  buttonText: 'next',
  isClosable: true,
  finalButtonText: BUTTON_TEXT,
  onFinish: jest.fn(),
}

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
