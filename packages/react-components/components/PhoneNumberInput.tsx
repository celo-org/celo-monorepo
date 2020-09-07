import Expandable from '@celo/react-components/components/Expandable'
import FormField from '@celo/react-components/components/FormField'
import FormTextInput from '@celo/react-components/components/FormTextInput'
import Touchable from '@celo/react-components/components/Touchable'
import ValidatedTextInput from '@celo/react-components/components/ValidatedTextInput.v2'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import SmsRetriever from '@celo/react-native-sms-retriever'
import { LocalizedCountry } from '@celo/utils/src/countries'
import { ValidatorKind } from '@celo/utils/src/inputValidation'
import { parsePhoneNumber } from '@celo/utils/src/phoneNumbers'
import React, { useRef } from 'react'
import { Platform, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'

const TAG = 'PhoneNumberInput'

async function requestPhoneNumber() {
  let phoneNumber
  try {
    if (Platform.OS === 'android') {
      phoneNumber = await SmsRetriever.requestPhoneNumber()
    } else {
      console.info(`${TAG}/requestPhoneNumber`, 'Not implemented in this platform')
    }
    return parsePhoneNumber(phoneNumber, '')
  } catch (error) {
    console.info(`${TAG}/requestPhoneNumber`, 'Could not request phone', error)
  }
}

interface Props {
  label: string
  style?: StyleProp<ViewStyle>
  country: LocalizedCountry | undefined
  nationalPhoneNumber: string
  onPressCountry: () => void
  onChange: (nationalPhoneNumber: string, countryCallingCode: string) => void
}

export default function PhoneNumberInput({
  label,
  style,
  country,
  nationalPhoneNumber,
  onPressCountry,
  onChange,
}: Props) {
  const shouldRequestPhoneNumberRef = useRef(nationalPhoneNumber.length === 0)
  const flagEmoji = country?.emoji
  const countryCallingCode = country?.countryCallingCode ?? ''
  const numberPlaceholder = country?.countryPhonePlaceholder.national ?? ''

  async function onPressCountryInternal() {
    const handled = await requestPhoneNumberIfNecessary()
    if (handled) {
      return
    }

    onPressCountry()
  }

  // Returns true if handled
  async function requestPhoneNumberIfNecessary() {
    if (!shouldRequestPhoneNumberRef.current) {
      return false
    }
    shouldRequestPhoneNumberRef.current = false

    const parsedPhoneNumber = await requestPhoneNumber()
    if (!parsedPhoneNumber) {
      return false
    }

    onChange(parsedPhoneNumber.displayNumber, `+${parsedPhoneNumber.countryCode}`)
    return true
  }

  function onChangePhoneNumber(newNationalPhoneNumber: string) {
    onChange(newNationalPhoneNumber, countryCallingCode)
  }

  return (
    <FormField style={[styles.container, style]} label={label}>
      <View style={styles.phoneNumberContainer}>
        <Touchable
          onPress={onPressCountryInternal}
          style={styles.countryCodeContainer}
          testID="CountrySelectionButton"
        >
          <View style={styles.countryCodeContent}>
            <Expandable isExpandable={true} isExpanded={false}>
              <Text style={styles.flag} testID={'countryCodeFlag'}>
                {flagEmoji}
              </Text>
              <Text style={styles.phoneCountryCode} testID={'countryCodeText'}>
                {countryCallingCode}
              </Text>
            </Expandable>
          </View>
        </Touchable>
        <ValidatedTextInput
          InputComponent={FormTextInput}
          style={styles.phoneNumberInput}
          value={nationalPhoneNumber}
          placeholder={numberPlaceholder}
          keyboardType="phone-pad"
          testID="PhoneNumberField"
          validator={ValidatorKind.Phone}
          countryCallingCode={countryCallingCode}
          onFocus={requestPhoneNumberIfNecessary}
          onChangeText={onChangePhoneNumber}
        />
      </View>
    </FormField>
  )
}

const styles = StyleSheet.create({
  container: {},
  phoneNumberContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  countryCodeContainer: {
    width: 112,
    paddingHorizontal: 12,
    alignItems: 'stretch',
    backgroundColor: colors.light,
    borderRadius: 8,
  },
  countryCodeContent: {
    flex: 1,
    justifyContent: 'center',
  },
  flag: {
    fontSize: 20,
    marginRight: 4,
  },
  phoneCountryCode: {
    ...fontStyles.regular,
    flex: 1,
  },
  phoneNumberInput: {
    flex: 1,
    marginLeft: 7,
  },
})
