import Expandable from '@celo/react-components/components/Expandable'
import FormField from '@celo/react-components/components/FormField'
import FormTextInput from '@celo/react-components/components/FormTextInput'
import FormUnderline from '@celo/react-components/components/FormUnderline'
import TextInput from '@celo/react-components/components/TextInput'
import Touchable from '@celo/react-components/components/Touchable'
import ValidatedTextInput from '@celo/react-components/components/ValidatedTextInput.v2'
import colors from '@celo/react-components/styles/colors.v2'
import SmsRetriever from '@celo/react-native-sms-retriever'
import { Countries } from '@celo/utils/src/countries'
import { ValidatorKind } from '@celo/utils/src/inputValidation'
import { getRegionCodeFromCountryCode, parsePhoneNumber } from '@celo/utils/src/phoneNumbers'
import * as React from 'react'
import {
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'

const TAG = 'PhoneNumberInput'

interface Props {
  style?: StyleProp<ViewStyle>
  label: string
  defaultCountry?: string | null
  setE164Number: (e164Number: string) => void
  setCountryCode: (countryCode: string) => void
  setIsValidNumber: (isValid: boolean) => void
  setRegionCode?: (regionCode: string) => void
  onInputFocus?: () => void
  onInputChange?: () => void
  onEndEditingPhoneNumber?: () => void
  onEndEditingCountryCode?: () => void
  inputCountryPlaceholder?: string
  initialInputPhonePlaceholder?: string
  lng?: string
  callingCode?: boolean
  defaultCountryCode?: string
  defaultPhoneNumber?: string
  onPressCountryCode: () => void
}

interface State {
  countryQuery: string
  countryCallingCode: string
  regionCode: string
  phoneNumber: string
  countries: Countries
  inputPhonePlaceholder?: string
  country?: string
}

export default class PhoneNumberInput extends React.Component<Props, State> {
  state = {
    countryQuery: '',
    countryCallingCode: '',
    regionCode: '',
    phoneNumber: '',
    // country data should be fetched before mounting to prevent a second render
    countries: new Countries(this.props.lng),
    inputPhonePlaceholder: this.props.initialInputPhonePlaceholder,
  }

  componentDidMount() {
    if (this.props.defaultCountry) {
      this.changeCountryQuery(this.props.defaultCountry)
    }

    if (this.props.defaultCountryCode) {
      const country = this.state.countries.getCountryByPhoneCountryCode(
        this.props.defaultCountryCode
      )

      this.changeCountryQuery(country.displayName)
    }

    if (this.props.defaultPhoneNumber) {
      this.onChangePhoneNumber(this.props.defaultPhoneNumber)
    }
  }

  async getPhoneNumberFromNativePickerAndroid() {
    try {
      try {
        return SmsRetriever.requestPhoneNumber()
      } catch (error) {
        console.info(
          `${TAG}/triggerPhoneNumberRequestAndroid`,
          'Could not request phone. This might be thrown if the user dismissed the modal',
          error
        )
        return
      }
    } catch (error) {
      console.info(`${TAG}/triggerPhoneNumberRequestAndroid`, 'Could not request phone', error)
    }
  }

  async triggerPhoneNumberRequest() {
    let phone
    try {
      if (Platform.OS === 'android') {
        phone = await this.getPhoneNumberFromNativePickerAndroid()
      } else {
        console.info(`${TAG}/triggerPhoneNumberRequest`, 'Not implemented in this platform')
      }
      const phoneNumber = parsePhoneNumber(phone, '')
      if (!phoneNumber) {
        return
      }
      this.setState({ phoneNumber: phoneNumber.displayNumber.toString() })

      // A country code is not enough to know the country of a phone number (e.g. both the US and Canada share the +1)
      // To get the country a Region Code is required, a two-letter country/region identifier (ISO-3166-1 Alpha2)
      const regionCode = phoneNumber.regionCode

      if (regionCode) {
        const displayName = this.state.countries.getCountryByCode(regionCode).displayName
        this.changeCountryQuery(displayName)
      }
    } catch (error) {
      console.info(`${TAG}/triggerPhoneNumberRequest`, 'Could not request phone', error)
    }
  }

  onCountryFocus = async () => {
    if (this.props.onInputFocus) {
      await this.props.onInputFocus()
    }

    if (!(this.state.phoneNumber || this.state.countryQuery)) {
      return this.triggerPhoneNumberRequest()
    }
  }

  changeCountryQuery = (countryQuery: string) => {
    if (this.props.onInputChange) {
      this.props.onInputChange()
    }

    const country = this.state.countries.getCountry(countryQuery)

    if (country) {
      const countryCallingCode = country.countryCallingCodes[0]
      const regionCode = getRegionCodeFromCountryCode(countryCallingCode) || ''
      this.setState(
        {
          countryQuery,
          countryCallingCode,
          regionCode,
          // @ts-ignore
          inputPhonePlaceholder: country.countryPhonePlaceholder.national,
        },
        // Reparse phone number in case user entered that first
        () => this.onChangePhoneNumber(this.state.phoneNumber)
      )
      this.props.setCountryCode(countryCallingCode)
      if (this.props.setRegionCode) {
        this.props.setRegionCode(regionCode)
      }
    } else {
      this.setState({
        countryQuery,
        countryCallingCode: '',
        regionCode: '',
      })
      this.props.setCountryCode('')
      if (this.props.setRegionCode) {
        this.props.setRegionCode('')
      }
    }
  }

  onChangePhoneNumber = (phoneNumber: string) => {
    if (this.props.onInputChange) {
      this.props.onInputChange()
    }
    const { countryCallingCode } = this.state

    const phoneDetails = parsePhoneNumber(phoneNumber, countryCallingCode)

    if (phoneDetails) {
      this.setState({
        phoneNumber: phoneDetails.displayNumber,
      })
      this.props.setE164Number(phoneDetails.e164Number)
      this.props.setIsValidNumber(true)
    } else {
      this.setState({
        phoneNumber,
      })
      this.props.setE164Number('')
      this.props.setIsValidNumber(false)
    }
  }

  keyExtractor = (item: string, index: number) => {
    return item
  }

  renderItem = ({ item: countryCode }: { item: string }) => {
    const { displayName, emoji, countryCallingCodes } = this.state.countries.getCountryByCode(
      countryCode
    )
    const onPress = () => this.changeCountryQuery(displayName)

    return (
      <TouchableOpacity onPress={onPress}>
        <View style={styles.selectCountry}>
          <Text style={[styles.autoCompleteItemText, styles.emoji]}>{emoji}</Text>
          {this.props.callingCode && (
            <View style={styles.callingCode}>
              <Text style={styles.autoCompleteItemText}>{countryCallingCodes[0]}</Text>
            </View>
          )}
          <View style={styles.countrySelectText}>
            <Text style={styles.autoCompleteItemText}>{displayName}</Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  renderTextInput = (props: any) => {
    return (
      <TextInput
        {...props}
        value={this.state.countryQuery}
        underlineColorAndroid="transparent"
        onFocus={this.onCountryFocus}
        placeholderTextColor={colors.inactive}
        testID={props.testID + 'TextInput'}
      />
    )
  }

  render() {
    const { label, style, onPressCountryCode /* defaultCountry: defaultCountryName */ } = this.props
    const { countryCallingCode /* , countryQuery */ } = this.state
    // const filteredCountries = this.state.countries.getFilteredCountries(countryQuery)

    // const { displayName: defaultDisplayName, emoji } = this.state.countries.getCountry(
    //   defaultCountryName
    // )

    return (
      <FormField style={[styles.container, style]} label={label}>
        <View style={styles.phoneNumberContainer}>
          <Touchable onPress={onPressCountryCode} style={styles.phoneCountryCodeContainer}>
            <>
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Expandable isExpandable={true} isExpanded={false}>
                  <Text style={styles.phoneCountryCode} testID={'countryCodeText'}>
                    {countryCallingCode}
                  </Text>
                </Expandable>
              </View>
              <FormUnderline />
            </>
          </Touchable>

          {/* <View style={[styles.borderedBox, styles.inputBox, styles.defaultCountryContainer]}>
            <Text style={styles.defaultCountryFlag}>{emoji}</Text>
            <Text style={styles.defaultCountryName}>{defaultDisplayName}</Text>
          </View> */}
          <ValidatedTextInput
            InputComponent={FormTextInput}
            style={styles.phoneNumberInput}
            onChangeText={this.onChangePhoneNumber}
            onEndEditing={this.props.onEndEditingPhoneNumber}
            value={this.state.phoneNumber}
            placeholder={this.state.inputPhonePlaceholder}
            keyboardType="phone-pad"
            testID="PhoneNumberField"
            validator={ValidatorKind.Phone}
            countryCallingCode={this.state.countryCallingCode}
          />
        </View>
      </FormField>
    )
  }
}

const styles = StyleSheet.create({
  container: {},
  borderedBox: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 3,
  },
  inputBox: {
    height: 50,
  },
  phoneNumberContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  phoneNumberInput: {
    flex: 1,
    marginLeft: 7,
  },
  phoneCountryCodeContainer: {
    // alignSelf: 'stretch',
    // flex: 1,
    // height: '100%',
    width: 60,
    alignItems: 'stretch',
    // textAlign: 'center',
    // backgroundColor: 'yellow',
  },
  phoneCountryCode: {
    flex: 1,
  },
  line: {
    height: 35,
    borderRightWidth: 1,
    borderColor: colors.inactive,
  },
  inputCountry: {
    padding: 3,
    marginTop: 1, // 6 vs 5 top vs bot space difference
  },
  // @ts-ignore
  listAutocomplete: {
    paddingHorizontal: 0,
    paddingVertical: 6,
    marginHorizontal: 0,
    flex: 1,
    backgroundColor: colors.white,
    borderColor: colors.inactive,
    borderWidth: 1,
    borderTopWidth: 1,
    borderRadius: 3,
    // Workaround the mess done for iOS in react-native-autocomplete-input :D
    ...Platform.select({
      ios: {
        left: undefined,
        position: 'relative',
        right: undefined,
        marginBottom: 6,
      },
    }),
  },
  autoCompleteDropDown: {
    position: 'relative',
    top: 3,
    padding: 0,
    flex: 1,
  },
  autoCompleteItemText: {
    fontSize: 15,
    margin: 4,
    backgroundColor: 'transparent',
  },
  defaultCountryContainer: {
    backgroundColor: colors.darkLightest,
    paddingVertical: 11,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  defaultCountryFlag: {
    fontSize: 23,
    color: '#FFFFFF',
  },
  defaultCountryName: {
    marginLeft: 30,
    fontSize: 15,
  },
  selectCountry: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
  emoji: {
    marginLeft: 10,
    textAlign: 'center',
    width: 22,
  },
  callingCode: {
    flex: 1,
  },
  countrySelectText: {
    borderColor: colors.inactive,
    borderWidth: 0,
    flex: 2,
    marginLeft: 0,
    paddingStart: 0,
  },
})
