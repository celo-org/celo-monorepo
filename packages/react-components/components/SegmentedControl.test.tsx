import SegmentedControl from '@celo/react-components/components/SegmentedControl'
import * as React from 'react'
import Animated from 'react-native-reanimated'
import { fireEvent, render } from 'react-native-testing-library'

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'))

describe(SegmentedControl, () => {
  it('renders correctly', () => {
    const position = new Animated.Value(0)
    const onChange = jest.fn()
    const { getByA11yLabel } = render(
      <SegmentedControl
        values={['Tab1', 'Tab2']}
        selectedIndex={1}
        onChange={onChange}
        position={position}
      />
    )

    const tab1 = getByA11yLabel('Tab1')
    expect(tab1).toBeDefined()
    expect(tab1.props.accessibilityRole).toBe('button')
    // For some reason this isn't set in Jest
    // TODO: investigate why
    // expect(tab1.props.accessibilityStates).toBe([])
    const tab2 = getByA11yLabel('Tab2')
    expect(tab2).toBeDefined()
    expect(tab1.props.accessibilityRole).toBe('button')
    // For some reason this isn't set in Jest
    // TODO: investigate why
    // expect(tab2.props.accessibilityStates).toBe(['selected'])

    fireEvent.press(tab1)
    // Run timers, because Touchable adds some delay
    jest.runAllTimers()
    expect(onChange).toHaveBeenCalledWith('Tab1', 0)
  })
})
