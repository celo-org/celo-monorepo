import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { debounce } from 'lodash'
import React, { useCallback } from 'react'
import { StyleSheet, Text, View } from 'react-native'

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
  Small = 'small',
  Medium = 'medium',
  Full = 'full',
}

export interface ButtonProps {
  onPress: () => void
  style?: any
  text: string | React.ReactNode
  accessibilityLabel?: string
  type: BtnTypes
  disabled?: boolean
  size?: BtnSizes
  testID?: string
  children?: React.ReactNode // remove? previously used for icons not sure if knew design will need but lets keep for now
}

export default function Button(props: ButtonProps) {
  const { accessibilityLabel, children, disabled, size, testID, text, type } = props

  // Debounce onPress event so that it is called once on trigger and
  // consecutive calls in given period are ignored.
  const debouncedOnPress = useCallback(
    debounce(props.onPress, BUTTON_TAP_DEBOUNCE_TIME, DEBOUNCE_OPTIONS),
    [props.onPress]
  )

  const [textColor, backgroundColor] = getColors(type, disabled)

  return (
    <View style={styles.root}>
      <Touchable
        onPress={debouncedOnPress}
        disabled={disabled}
        style={[styles.button, getSizeStyle(size), { backgroundColor }]}
        testID={testID}
      >
        <View style={styles.containerButton}>
          {children}
          <Text
            accessibilityLabel={accessibilityLabel}
            style={[fontStyles.regular600, { color: textColor }]}
          >
            {text}
          </Text>
        </View>
      </Touchable>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    margin: 10,
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
  containerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
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

function getSizeStyle(size: BtnSizes | undefined) {
  switch (size) {
    case BtnSizes.Small:
      return styles.small
    case BtnSizes.Full:
      return styles.full
    default:
      return styles.medium
  }
}
