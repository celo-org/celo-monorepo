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
import { ScreenProps, withScreenSize } from 'src/layout/ScreenSize'
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

class PhoneInput extends React.PureComponent<Props & ScreenProps, State> {
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
    // remove non phone number characters
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

  getPlaceholder = () => {
    return 'Phone number'
  }

  updateSuggestions = ({ value }) => {
    this.onChangeCountryQuery(value)
  }

  onCounryInputKeyPress = (event) => {}

  // TODO set the caling code if counry name is just typed
  //  TODO figure out what on Suggestion Selected is for and if we need it

  onInputChange = (_, { newValue, method }) => {
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

  renderSuggestionsContainer = ({ containerProps, children }) => {
    const { className, ...otherProps } = containerProps
    const isOpen = this.filteredCountries().length > 0

    return (
      <View {...otherProps} style={[styles.suggestions, isOpen && styles.suggestionsOpen]}>
        {children}
      </View>
    )
  }

  renderTextInput = (props: any) => {
    return (
      <TextInput
        style={[standardStyles.input, standardStyles.inputDarkMode]}
        focusStyle={standardStyles.inputDarkFocused}
        {...props}
        value={this.state.countryQuery}
        onKeyPress={this.onCounryInputKeyPress}
      />
    )
  }

  renderItem = (countryCode: string, { isHighlighted }) => {
    // @ts-ignore
    const { displayName, emoji, countryCallingCodes } = COUNTRIES.getCountryByCode(countryCode)

    const onPress = () => {
      this.setState({ countryCallingCode: countryCallingCodes[0] })
      this.onChangeCountryQuery(displayName)
    }

    return (
      <TouchableOpacity onPress={onPress}>
        <View
          style={[standardStyles.row, isHighlighted && { borderBottomColor: colors.primaryHover }]}
        >
          <Text>{emoji || `🏳`}</Text>
          <Text style={[fonts.p, textStyles.invert]}>{displayName}</Text>
        </View>
      </TouchableOpacity>
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
        <style>{`
          .react-autosuggest__suggestions-list {
            margin: 0;
            padding-left: 0;
          }

          .react-autosuggest__suggestion {
            list-style-type: none;
          }
          .react-autosuggest__container--open {
            padding: 15;
            border-color: ${colors.white},
            border-width: 1
          }
        `}</style>
        <View style={styles.container}>
          <Autosuggest
            alwaysRenderSuggestions={true}
            suggestions={this.filteredCountries()}
            getSuggestionValue={getSuggestionValue}
            onSuggestionsFetchRequested={this.updateSuggestions}
            renderSuggestion={this.renderItem}
            renderInputComponent={this.renderTextInput}
            renderSuggestionsContainer={this.renderSuggestionsContainer}
            inputProps={inputProps}
            highlightFirstSuggestion={true}
          />
        </View>
        <View style={[standardStyles.row, styles.fakeInputBorder]}>
          <Text
            style={[
              fonts.legal,
              this.state.countryCallingCode.length > 0 ? textStyles.invert : styles.ccplaceholder,
              textStyles.center,
              styles.countryCode,
            ]}
          >
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
  suggestions: {
    width: '100%',
    backgroundColor: colors.dark,
    position: 'absolute',
    zIndex: 1000,
    borderRadius: 2,
  },
  suggestionsOpen: {
    marginBottom: 5,
    borderColor: colors.light,
    borderWidth: 1,
    padding: 15,
  },
  ccplaceholder: {
    color: colors.placeholderDarkMode,
  },
  container: {
    zIndex: 3,
  },
})

export default withScreenSize<Props>(PhoneInput)
