import Touchable from '@celo/react-components/components/Touchable'
import Backspace from '@celo/react-components/icons/Backspace'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface Props {
  showDecimal: boolean
  onDigitPress: (digit: number) => void
  onBackspacePress: () => void
  onDecimalPress?: () => void
}

function DigitButton({
  digit,
  onDigitPress,
}: {
  digit: number
  onDigitPress: (digit: number) => void
}) {
  const onPress = () => onDigitPress(digit)
  return (
    <Touchable borderless={true} onPress={onPress}>
      <Text style={style.digit}>{digit}</Text>
    </Touchable>
  )
}

export default function NumberKeypad(props: Props) {
  // TODO(Rossy) i18n the decimal
  return (
    <View style={style.container}>
      <View style={style.row}>
        <DigitButton digit={1} onDigitPress={props.onDigitPress} />
        <DigitButton digit={2} onDigitPress={props.onDigitPress} />
        <DigitButton digit={3} onDigitPress={props.onDigitPress} />
      </View>
      <View style={style.row}>
        <DigitButton digit={4} onDigitPress={props.onDigitPress} />
        <DigitButton digit={5} onDigitPress={props.onDigitPress} />
        <DigitButton digit={6} onDigitPress={props.onDigitPress} />
      </View>
      <View style={style.row}>
        <DigitButton digit={7} onDigitPress={props.onDigitPress} />
        <DigitButton digit={8} onDigitPress={props.onDigitPress} />
        <DigitButton digit={9} onDigitPress={props.onDigitPress} />
      </View>
      <View style={style.row}>
        {props.showDecimal ? (
          <Touchable borderless={true} onPress={props.onDecimalPress}>
            <Text style={style.digit}>.</Text>
          </Touchable>
        ) : (
          <View style={style.digit} />
        )}
        <DigitButton digit={0} onDigitPress={props.onDigitPress} />
        <Touchable borderless={true} onPress={props.onBackspacePress}>
          <View style={style.digit}>
            <Backspace />
          </View>
        </Touchable>
      </View>
    </View>
  )
}

const style = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  digit: {
    ...fontStyles.bodyBold,
    width: 60,
    padding: 15,
    fontSize: 24,
    lineHeight: 40,
    textAlign: 'center',
  },
})
