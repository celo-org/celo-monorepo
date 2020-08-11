import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
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
    const {
      onPress,
      text,
      accessibilityLabel,
      solid,
      disabled,
      style,
      textStyle,
      children,
    } = this.props
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
        <>
          {children}
          <Text
            accessibilityLabel={accessibilityLabel}
            style={[
              styles.text,
              solid ? { color: colors.light } : { color: colors.greenBrand },
              children ? styles.textPadding : null,
              textStyle,
            ]}
          >
            {text}
          </Text>
        </>
      </Touchable>
    )
  }
}

const PADDING_VERTICAL = 6
const PADDING_HORIZONTAL = 16

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    paddingVertical: PADDING_VERTICAL,
    paddingHorizontal: PADDING_HORIZONTAL,
    borderRadius: 2,
  },
  solid: {
    backgroundColor: colors.greenBrand,
    paddingVertical: PADDING_VERTICAL + 2,
    paddingHorizontal: PADDING_HORIZONTAL + 2,
  },
  hollow: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.greenBrand,
  },
  text: {
    ...fontStyles.semiBold,
    fontSize: 13,
    lineHeight: 20,
    color: colors.gray5,
    textAlign: 'center',
  },
  textPadding: {
    paddingLeft: 10,
    paddingTop: 7,
  },
})
