import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import fonts from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { StyleSheet, Text, TextStyle, ViewStyle } from 'react-native'

interface ButtonProps {
  onPress: () => void
  text: string
  accessibilityLabel?: string
  solid: boolean
  disabled?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
  testID?: string
}

const TOUCH_OVERFLOW = 7

export default class SmallButton extends React.Component<ButtonProps> {
  render() {
    const { onPress, text, accessibilityLabel, solid, disabled, style, textStyle } = this.props
    return (
      <Touchable
        testID={this.props.testID}
        onPress={onPress}
        disabled={disabled}
        hitSlop={{
          top: TOUCH_OVERFLOW,
          left: TOUCH_OVERFLOW,
          bottom: TOUCH_OVERFLOW,
          right: TOUCH_OVERFLOW,
        }}
        style={[styles.button, solid ? styles.solid : styles.hollow, style]}
      >
        <Text
          accessibilityLabel={accessibilityLabel}
          style={[
            fonts.linkSmall,
            styles.text,
            solid ? { color: colors.white } : { color: colors.celoGreen },
            textStyle,
          ]}
        >
          {text}
        </Text>
      </Touchable>
    )
  }
}

const PADDING_VERTICAL = 6
const PADDING_HORIZONTAL = 16

const styles = StyleSheet.create({
  button: {
    minWidth: 160,
    textAlign: 'center',
    paddingVertical: PADDING_VERTICAL,
    paddingHorizontal: PADDING_HORIZONTAL,
    alignSelf: 'flex-start',
    alignItems: 'center',
    borderRadius: 2,
  },
  solid: {
    backgroundColor: colors.celoGreen,
    paddingVertical: PADDING_VERTICAL + 2,
    paddingHorizontal: PADDING_HORIZONTAL + 2,
  },
  hollow: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.celoGreen,
  },
  text: {
    lineHeight: 20,
  },
})
