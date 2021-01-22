import * as React from 'react'
import { fireEvent, render } from 'react-native-testing-library'
import { navigate } from 'src/navigator/NavigationService'
import RewardsPill from 'src/navigator/RewardsPill'
import { Screens } from 'src/navigator/Screens'

describe('RewardsPill', () => {
  it('renders correctly', () => {
    const tree = render(<RewardsPill />)
    expect(tree).toMatchSnapshot()
  })

  it('opens the consumer incentives screen when pressed', () => {
    const { getByTestId } = render(<RewardsPill />)
    fireEvent.press(getByTestId('EarnRewards'))
    expect(navigate).toBeCalledWith(Screens.ConsumerIncentivesHomeScreen)
  })
})
