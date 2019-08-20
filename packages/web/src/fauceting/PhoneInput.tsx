import { Countries, PhoneNumberUtils } from '@celo/utils'
import * as React from 'react'
import {
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TextInputChangeEventData,
  TouchableOpacity,
  View,
} from 'react-native'
// import Autocomplete from 'react-native-autocomplete-input'
import { TextInput } from 'src/forms/FormComponents'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'

interface Props {
  onChangeNumber: (e164Number: string) => void
}

interface State {
  countryQuery: string
  countryCallingCode: string
  phoneNumber: string
}

const COUNTRIES = new Countries('en')

class PhoneInput extends React.PureComponent<Props, State> {
  state: State = {
    countryQuery: '',
    countryCallingCode: '',
    phoneNumber: '',
  }

  filteredCountries = () => {
    return COUNTRIES.getFilteredCountries(this.state.countryQuery)
  }

  onChangeCountryQuery = (countryQuery: string) => {
    this.setState({ countryQuery })
  }

  setNumber = (event: NativeSyntheticEvent<TextInputChangeEventData>) => {
    const phone = event.nativeEvent.text

    const phoneInfo = PhoneNumberUtils.parsePhoneNumber(phone, this.state.countryCallingCode)

    if (phoneInfo) {
      this.setState({ phoneNumber: phoneInfo.displayNumber })
      this.props.onChangeNumber(phoneInfo.e164Number)
    } else {
      this.setState({ phoneNumber: phone })
      this.props.onChangeNumber('')
    }
  }

  renderTextInput = (props: any) => (
    <TextInput
      focusStyle={standardStyles.inputDarkFocused}
      {...props}
      value={this.state.countryQuery}
      placeholderTextColor={colors.inactive}
    />
  )

  renderItem = (countryCode: string) => {
    const { displayName, emoji } = COUNTRIES.getCountryByCode(countryCode)
    const onPress = () => this.onChangeCountryQuery(displayName)

    return (
      <TouchableOpacity onPress={onPress}>
        <View style={standardStyles.row}>
          <Text>{emoji}</Text>
          <Text style={fonts.p}>{displayName}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  getPlaceholder = () => {
    return 'phone number'
  }

  render() {
    return (
      <>
        {/* <Autocomplete
          autoCapitalize="none"
          autoCorrect={false}
          // listContainerStyle={style.autoCompleteDropDown}
          // inputContainerStyle={[style.borderedBox, style.inputBox, style.inputCountry]}
          // listStyle={[style.borderedBox, style.listAutocomplete]}
          data={this.filteredCountries()}
          defaultValue={this.state.countryQuery}
          onChangeText={this.onChangeCountryQuery}
          // onEndEditing={this.props.onEndEditingCountryCode}
          placeholder={'country'}
          renderItem={this.renderItem}
          renderTextInput={this.renderTextInput}
        /> */}
        <View style={[standardStyles.row, styles.fakeInputBorder]}>
          <Text style={[fonts.legal, textStyles.invert, textStyles.center, styles.countryCode]}>
            {this.state.countryCallingCode}+00
          </Text>
          <View style={styles.line} />
          <TextInput
            type={'tel'}
            style={[standardStyles.input, standardStyles.inputDarkMode, styles.input]}
            focusStyle={standardStyles.inputDarkFocused}
            name="phone"
            placeholder={this.getPlaceholder()}
            onChange={this.setNumber}
            value={this.state.phoneNumber}
            // disabled={this.state.countryCallingCode.length === 0}
          />
        </View>
      </>
    )
  }
}

const styles = StyleSheet.create({
  line: {
    height: 35,
    width: 1,
    borderLeftWidth: 1,
    borderColor: colors.placeholderGray,
    marginHorizontal: 10,
    flex: 1,
  },
  countryCode: {
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 15,
  },
  input: {
    borderWidth: 0,
    paddingVertical: 0,
    marginVertical: 0,
  },
  fakeInputBorder: {
    alignContent: 'center',
    paddingVertical: 0,
    borderWidth: 1,
    alignItems: 'center',
    borderRadius: 3,
    borderColor: colors.gray,
    color: colors.white,
    width: '100%',
  },
})

export default PhoneInput
