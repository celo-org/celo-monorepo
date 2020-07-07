import * as React from 'react'
import 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import Education, { EducationTopic, Props } from 'src/account/Education'
import { navigateBack } from 'src/navigator/NavigationService'
import { createMockStore } from 'test/utils'

const BUTTON_TEXT = 'Done'

const educationProps: Props = {
  stepInfo: [
    {
      image: null,
      topic: EducationTopic.celo,
      title: 'Step 1',
      text: 'The Journey Begins',
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
    fireEvent.press(edu.getByTestId('Education/CloseIcon'))
    expect(navigateBack).toBeCalled()
  })
})
