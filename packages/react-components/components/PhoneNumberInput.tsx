import TextInput from '@celo/react-components/components/TextInput'
import ValidatedTextInput, {
  PhoneValidatorProps,
} from '@celo/react-components/components/ValidatedTextInput'
import colors from '@celo/react-components/styles/colors'
import { Countries } from '@celo/utils/src/countries'
import { ValidatorKind } from '@celo/utils/src/inputValidation'
import { getRegionCodeFromCountryCode, parsePhoneNumber } from '@celo/utils/src/phoneNumbers'
import * as React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Autocomplete from 'react-native-autocomplete-input'

interface Props {
  style?: any
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
  inputPhonePlaceholder?: string
  lng?: string
  callingCode?: boolean
  defaultCountryCode?: string
  defaultPhoneNumber?: string
}

interface State {
  countryQuery: string
  countryCallingCode: string
  regionCode: string
  phoneNumber: string
  countries: Countries
}

export default class PhoneNumberInput extends React.Component<Props, State> {
  state = {
    countryQuery: '',
    countryCallingCode: '',
    regionCode: '',
    phoneNumber: '',
    // country data should be fetched before mounting to prevent a second render
    countries: new Countries(this.props.lng),
  }

  componentDidMount() {
    if (this.props.defaultCountry) {
      this.onChangeCountryQuery(this.props.defaultCountry)
    }

    if (this.props.defaultCountryCode) {
      const country = this.state.countries.getCountryByPhoneCountryCode(
        this.props.defaultCountryCode
      )

      this.onChangeCountryQuery(country.displayName)
    }

    if (this.props.defaultPhoneNumber) {
      this.onChangePhoneNumber(this.props.defaultPhoneNumber)
    }
  }

  onChangeCountryQuery = (countryQuery: string) => {
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

  renderItem = (countryCode: string) => {
    const { displayName, emoji, countryCallingCodes } = this.state.countries.getCountryByCode(
      countryCode
    )
    const onPress = () => this.onChangeCountryQuery(displayName)

    return (
      <TouchableOpacity onPress={onPress}>
        <View style={style.selectCountry}>
          <Text style={[style.autoCompleteItemText, style.emoji]}>{emoji}</Text>
          {this.props.callingCode && (
            <View style={style.callingCode}>
              <Text style={style.autoCompleteItemText}>{countryCallingCodes[0]}</Text>
            </View>
          )}
          <View style={style.countrySelectText}>
            <Text style={style.autoCompleteItemText}>{displayName}</Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  renderTextInput = (props: any) => (
    <TextInput
      {...props}
      value={this.state.countryQuery}
      underlineColorAndroid="transparent"
      onFocus={this.props.onInputFocus}
      placeholderTextColor={colors.inactive}
    />
  )

  render() {
    const { countryCallingCode, countryQuery } = this.state
    const filteredCountries = this.state.countries.getFilteredCountries(countryQuery)
    const { style: propsStyle, defaultCountry: defaultCountryName } = this.props

    const { displayName: defaultDisplayName, emoji } = this.state.countries.getCountry(
      defaultCountryName
    )

    return (
      <View style={[propsStyle, style.container]}>
        {!defaultDisplayName && (
          <Autocomplete
            autoCapitalize="none"
            autoCorrect={false}
            listContainerStyle={style.autoCompleteDropDown}
            inputContainerStyle={[style.borderedBox, style.inputBox, style.inputCountry]}
            listStyle={[style.borderedBox, style.listAutocomplete]}
            data={filteredCountries}
            defaultValue={countryQuery}
            onChangeText={this.onChangeCountryQuery}
            onEndEditing={this.props.onEndEditingCountryCode}
            placeholder={this.props.inputCountryPlaceholder}
            renderItem={this.renderItem}
            renderTextInput={this.renderTextInput}
            testID="CountryNameField"
          />
        )}
        {!!defaultDisplayName && (
          <View style={[style.borderedBox, style.inputBox, style.defaultCountryContainer]}>
            <Text style={style.defaultCountryFlag}>{emoji}</Text>
            <Text style={style.defaultCountryName}>{defaultDisplayName}</Text>
          </View>
        )}
        <View style={[style.phoneNumberContainer, style.borderedBox]}>
          <Text style={style.phoneCountryCode}>{countryCallingCode}</Text>
          <View style={style.line} />
          <ValidatedTextInput<PhoneValidatorProps>
            style={[style.inputBox, style.phoneNumberInput]}
            placeholderTextColor={colors.inactive}
            onChangeText={this.onChangePhoneNumber}
            onEndEditing={this.props.onEndEditingPhoneNumber}
            value={this.state.phoneNumber}
            underlineColorAndroid="transparent"
            placeholder={this.props.inputPhonePlaceholder}
            keyboardType="phone-pad"
            testID="PhoneNumberField"
            validator={ValidatorKind.Phone}
            countryCallingCode={this.state.countryCallingCode}
          />
        </View>
      </View>
    )
  }
}

const style = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: colors.background,
  },
  borderedBox: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 3,
  },
  inputBox: {
    height: 50,
  },
  phoneNumberContainer: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  phoneNumberInput: {
    flex: 1,
    marginLeft: 9,
  },
  phoneCountryCode: {
    width: 60,
    textAlign: 'center',
    lineHeight: 35,
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
