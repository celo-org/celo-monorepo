import * as React from 'react'
import 'react-native'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import GoldEducation from 'src/account/GoldEducation'
import { createMockStore } from 'test/utils'

it('renders correctly', () => {
  const tree = renderer.create(
    <Provider store={createMockStore({})}>
      <GoldEducation />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})

describe('when first time (!goldToken.educationCompleted)', () => {
  it('does not show the close button', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore({ goldToken: { educationCompleted: false } })}>
        <GoldEducation />
      </Provider>
    )

    expect(getByTestId('DrawerTopBar')).toBeTruthy()
  })
})

describe('when not first time (goldToken.educationCompleted)', () => {
  it('shows the close button', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore({ goldToken: { educationCompleted: true } })}>
        <GoldEducation />
      </Provider>
    )

    expect(getByTestId('Education/top').findByProps({ testID: 'Education/CloseIcon' })).toBeTruthy()
  })
})
