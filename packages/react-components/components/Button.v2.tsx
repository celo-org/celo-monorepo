import Touchable from '@celo/react-components/components/Touchable'
import colors, { Colors } from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { debounce } from 'lodash'

import React, { useCallback } from 'react'
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'

const BUTTON_TAP_DEBOUNCE_TIME = 300 // milliseconds
const DEBOUNCE_OPTIONS = {
  leading: true,
  trailing: false,
}

export enum BtnTypes {
  PRIMARY = 'Primary',
  SECONDARY = 'Secondary',
  TERTIARY = 'Tertiary',
}

export enum BtnSizes {
  SMALL = 'small',
  MEDIUM = 'medium',
  FULL = 'full',
}

export interface ButtonProps {
  onPress: () => void
  style?: StyleProp<ViewStyle>
  text: string
  accessibilityLabel?: string
  type?: BtnTypes
  disabled?: boolean
  size?: BtnSizes
  testID?: string
}

export default React.memo(function Button(props: ButtonProps) {
  const { accessibilityLabel, disabled, size, testID, text, type = BtnTypes.PRIMARY, style } = props

  // Debounce onPress event so that it is called once on trigger and
  // consecutive calls in given period are ignored.
  const debouncedOnPress = useCallback(
    debounce(props.onPress, BUTTON_TAP_DEBOUNCE_TIME, DEBOUNCE_OPTIONS),
    [props.onPress, disabled]
  )

  const [textColor, backgroundColor] = getColors(type, disabled)

  return (
    <View style={style ? [styles.root, style] : styles.root}>
      {/* these Views cannot be combined as it will cause ripple to not respect the border radius */}
      <View style={styles.containRipple}>
        <Touchable
          onPress={debouncedOnPress}
          disabled={disabled}
          style={getStyle(size, backgroundColor)}
          testID={testID}
        >
          <Text
            accessibilityLabel={accessibilityLabel}
            style={{ ...fontStyles.regular600, color: textColor }}
          >
            {text}
          </Text>
        </Touchable>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
  },
  // on android Touchable Provides a ripple effeft, by itself it does not respect the border radius on Touchable
  containRipple: {
    borderRadius: 100,
    overflow: 'hidden',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 16,
  },
  small: {
    height: 40,
    minWidth: 98,
  },
  medium: {
    height: 48,
    minWidth: 98,
  },
  full: {
    height: 48,
    flex: 1,
  },
})

function getColors(type: BtnTypes, disabled: boolean | undefined) {
  let textColor
  let backgroundColor
  switch (type) {
    case BtnTypes.PRIMARY:
      textColor = colors.light
      backgroundColor = disabled ? colors.greenFaint : colors.greenUI
      break
    case BtnTypes.SECONDARY:
      textColor = disabled ? colors.gray4 : colors.dark
      backgroundColor = colors.beige
      break
    case BtnTypes.TERTIARY:
      textColor = colors.light
      backgroundColor = disabled ? colors.goldFaint : colors.goldUI
      break
  }

  return [textColor, backgroundColor]
}

function getStyle(size: BtnSizes | undefined, backgroundColor: Colors) {
  switch (size) {
    case BtnSizes.SMALL:
      return { ...styles.button, ...styles.small, backgroundColor }
    case BtnSizes.FULL:
      return { ...styles.button, ...styles.full, backgroundColor }
    default:
      return { ...styles.button, ...styles.medium, backgroundColor }
  }
}
