import { Countries, PhoneNumberUtils } from '@celo/utils'
import * as React from 'react'
import Autosuggest from 'react-autosuggest'
import {
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TextInputChangeEventData,
  TouchableOpacity,
  View,
} from 'react-native'
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

const COUNTRIES = new Countries('en-us')

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
    // remove not phone number characters
    const phone = event.nativeEvent.text.replace(/[^\d\(\)-\s.]/g, '')

    const phoneInfo =
      phone.length && PhoneNumberUtils.parsePhoneNumber(phone, this.state.countryCallingCode)

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
      style={[standardStyles.input, standardStyles.inputDarkMode]}
      focusStyle={standardStyles.inputDarkFocused}
      {...props}
      value={this.state.countryQuery}
    />
  )

  renderItem = (countryCode: string) => {
    // @ts-ignore
    const { displayName, emoji, countryCallingCodes } = COUNTRIES.getCountryByCode(countryCode)

    const onPress = () => {
      this.setState({ countryCallingCode: countryCallingCodes[0] })
      this.onChangeCountryQuery(displayName)
    }

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
    return 'Phone number'
  }

  updateSuggestions = ({ value }) => {
    this.onChangeCountryQuery(value)
  }

  // TODO set the caling code if counry name is just typed
  //  TODO figure out what on Suggestion Selected is for and if we need it

  onInputChange = (_, { newValue }) => {
    this.onChangeCountryQuery(newValue)
    setImmediate(() => {
      const country = COUNTRIES.getCountry(newValue)
      if (country.displayName) {
        this.setState({
          countryQuery: country.displayName,
          // @ts-ignore
          countryCallingCode: country.countryCallingCodes[0],
        })
      } else {
        this.setState({
          countryCallingCode: '',
        })
      }
    })
  }

  onSuggestionSelected = (x) => {
    debugger
    console.log(x)
  }

  renderSuggestionsContainer = ({ containerProps, children, query }) => {
    const { className, ...otherProps } = containerProps
    return (
      <View
        {...otherProps}
        style={{ backgroundColor: colors.white, position: 'absolute', zIndex: 100 }}
      >
        {children}
      </View>
    )
  }

  render() {
    const inputProps = {
      placeholder: 'Country',
      value: this.state.countryQuery,
      onChange: this.onInputChange,
    }

    return (
      <>
        <Autosuggest
          alwaysRenderSuggestions={true}
          suggestions={this.filteredCountries()}
          getSuggestionValue={getSuggestionValue}
          onSuggestionsFetchRequested={this.updateSuggestions}
          onSuggestionSelected={this.onSuggestionSelected}
          renderSuggestion={this.renderItem}
          renderInputComponent={this.renderTextInput}
          renderSuggestionsContainer={this.renderSuggestionsContainer}
          inputProps={inputProps}
          highlightFirstSuggestion={true}
        />
        <View style={[standardStyles.row, styles.fakeInputBorder]}>
          <Text style={[fonts.legal, textStyles.invert, textStyles.center, styles.countryCode]}>
            {this.state.countryCallingCode || '+00'}
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

const getSuggestionValue = (suggestion) => suggestion

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
