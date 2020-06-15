import Touchable from '@celo/react-components/components/Touchable'
import colors, { Colors } from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { debounce } from 'lodash'
import React, { ReactNode, useCallback } from 'react'
import { ActivityIndicator, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'

const BUTTON_TAP_DEBOUNCE_TIME = 300 // milliseconds
const DEBOUNCE_OPTIONS = {
  leading: true,
  trailing: false,
}

export enum BtnTypes {
  PRIMARY = 'Primary',
  SECONDARY = 'Secondary',
  TERTIARY = 'Tertiary',
  ONBOARDING = 'Onboarding',
}

export enum BtnSizes {
  SMALL = 'small',
  MEDIUM = 'medium',
  FULL = 'full',
}

export interface ButtonProps {
  onPress: () => void
  style?: StyleProp<ViewStyle>
  text: string | ReactNode
  showLoading?: boolean
  accessibilityLabel?: string
  type?: BtnTypes
  disabled?: boolean
  size?: BtnSizes
  testID?: string
}

export default React.memo(function Button(props: ButtonProps) {
  const {
    accessibilityLabel,
    disabled,
    size,
    testID,
    text,
    type = BtnTypes.PRIMARY,
    style,
    showLoading,
  } = props

  // Debounce onPress event so that it is called once on trigger and
  // consecutive calls in given period are ignored.
  const debouncedOnPress = useCallback(
    debounce(props.onPress, BUTTON_TAP_DEBOUNCE_TIME, DEBOUNCE_OPTIONS),
    [props.onPress, disabled]
  )

  const [textColor, backgroundColor, opacity] = getColors(type, disabled)

  return (
    <View style={getStyleForWrapper(size, style)}>
      {/* these Views cannot be combined as it will cause ripple to not respect the border radius */}
      <View style={styles.containRipple}>
        <Touchable
          onPress={debouncedOnPress}
          disabled={disabled}
          style={getStyle(size, backgroundColor, opacity)}
          testID={testID}
        >
          {showLoading ? (
            <ActivityIndicator size="small" color={colors.celoGreen} />
          ) : (
            <Text
              accessibilityLabel={accessibilityLabel}
              style={{ ...fontStyles.regular600, color: textColor }}
            >
              {text}
            </Text>
          )}
        </Touchable>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
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
    minWidth: 120,
  },
  medium: {
    height: 48,
    minWidth: 120,
  },
  full: {
    height: 48,
    flexGrow: 1,
  },
})

function getColors(type: BtnTypes, disabled: boolean | undefined) {
  let textColor
  let backgroundColor
  let opacity
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
    case BtnTypes.ONBOARDING:
      textColor = colors.onboardingAccent
      backgroundColor = colors.onboardingLightBlue
      opacity = disabled ? 0.5 : 1.0
      break
  }

  return [textColor, backgroundColor, opacity]
}

function getStyle(
  size: BtnSizes | undefined,
  backgroundColor: Colors,
  opacity: number | undefined
) {
  switch (size) {
    case BtnSizes.SMALL:
      return { ...styles.button, ...styles.small, backgroundColor, opacity }
    case BtnSizes.FULL:
      return { ...styles.button, ...styles.full, backgroundColor, opacity }
    default:
      return { ...styles.button, ...styles.medium, backgroundColor, opacity }
  }
}

function getStyleForWrapper(
  size: BtnSizes | undefined,
  style: StyleProp<ViewStyle>
): StyleProp<ViewStyle> {
  return [{ flexDirection: size === BtnSizes.FULL ? 'column' : 'row' }, style]
}
