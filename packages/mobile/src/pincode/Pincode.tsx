/**
 * This is a VIEW. We use it everwhere we need to show PIN pad
 * with an input, e.g. get/ensure/set pincode.
 */
import Button, { BtnTypes } from '@celo/react-components/components/Button'
import HorizontalLine from '@celo/react-components/components/HorizontalLine'
import NumberKeypad from '@celo/react-components/components/NumberKeypad'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import React, { useCallback, useMemo } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import PincodeTextbox from 'src/pincode/PincodeTextbox'

interface Props {
  onPress: () => void
  title: string
  placeholder: string
  buttonText: string
  maxLength?: number
  isPinValid: (pin: string) => boolean
  pin: string
  onChangePin: (pin: string) => void
}

function Pincode(props: Props) {
  const { maxLength, pin, onChangePin, onPress, title, placeholder, buttonText, isPinValid } = props

  const onDigitPress = useCallback(
    (digit) => {
      let newPin = pin + digit
      if (maxLength) {
        newPin = newPin.substr(0, maxLength)
      }
      onChangePin(newPin)
    },
    [pin, onChangePin, maxLength]
  )

  const onBackspacePress = useCallback(() => {
    onChangePin(pin.substr(0, pin.length - 1))
  }, [pin, onChangePin])

  const validPin = useMemo(() => isPinValid(pin), [pin, isPinValid])

  return (
    <>
      <ScrollView contentContainerStyle={style.scrollContainer}>
        <View>
          <Text style={[fontStyles.h1, componentStyles.marginTop15]}>{title}</Text>
          <View style={style.pincodeContainer}>
            <PincodeTextbox pin={pin} placeholder={placeholder} />
          </View>
        </View>
        <View>
          <HorizontalLine />
          <View style={style.keypadContainer}>
            <NumberKeypad
              showDecimal={false}
              onDigitPress={onDigitPress}
              onBackspacePress={onBackspacePress}
            />
          </View>
        </View>
      </ScrollView>
      <Button
        testID="Pincode-Submit"
        text={buttonText}
        standard={false}
        type={BtnTypes.PRIMARY}
        onPress={onPress}
        disabled={!validPin}
      />
    </>
  )
}

const style = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 0,
  },
  pincodeContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  keypadContainer: {
    marginBottom: 15,
    paddingHorizontal: 20,
  },
})

export default Pincode
