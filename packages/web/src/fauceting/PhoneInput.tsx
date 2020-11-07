import { Countries, PhoneNumberUtils } from '@celo/utils'
import memoizeOne from 'memoize-one'
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
import { TextInput } from 'src/forms/TextInput'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import { ScreenProps, withScreenSize } from 'src/layout/ScreenSize'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'

interface Props {
  onChangeNumber: (e164Number: string) => void
}

interface InputProps {
  value: string
  onChange: (_: unknown, object: { newValue: string; method: string }) => void
  type: string
  placeholder: string
}

interface AutoSuggestInputProps {
  type: 'text'
  value: string
  placeholder: string
  onChange: () => void
  onFocus: () => void
  onBlur: () => void
  onKeyDown: () => void
}

interface SuggestionContainerProps {
  containerProps: { className: string; id: string; key: string }
  children: React.ReactNode
}

type UpdateReasons =
  | 'input-focused'
  | 'escape-pressed'
  | 'suggestions-revealed'
  | 'suggestion-selected'

const COUNTRIES = new Countries('en-us')

const getCountries = memoizeOne((search: string) => COUNTRIES.getFilteredCountries(search))

interface State {
  countryQuery: string
  countryCode: string
  phoneNumber: string
}
class PhoneInput extends React.PureComponent<Props & ScreenProps & I18nProps, State> {
  state: State = {
    countryQuery: '',
    countryCode: '',
    phoneNumber: '',
  }

  getEmoji = (): string => {
    // @ts-ignore -- TS isnt recognizing that Localized country extends Country
    return COUNTRIES.getCountryByCode(this.state.countryCode).emoji || ''
  }

  getCallingCode = () => {
    const country = COUNTRIES.getCountryByCode(this.state.countryCode)
    // @ts-ignore -- TS isnt recognizing that Localized country extends Country\
    return country ? country.countryCallingCodes[0] : ''
  }

  filteredCountries = () => {
    return getCountries(this.state.countryQuery)
  }

  onChangeCountryQuery = (countryQuery: string) => {
    this.setState({ countryQuery })
  }

  onNumberInput = (event: NativeSyntheticEvent<TextInputChangeEventData>) => {
    // remove non phone number characters
    const phone = event.nativeEvent.text.replace(/[^\d\(\)-\s.+]/g, '')

    this.setNumber(phone, this.getCallingCode())
  }

  setNumber = (rawPhone: string, countryCallingCode: string) => {
    const phoneInfo =
      rawPhone.length && PhoneNumberUtils.parsePhoneNumber(rawPhone, countryCallingCode)

    if (phoneInfo) {
      this.setState({ phoneNumber: phoneInfo.displayNumber })
      this.props.onChangeNumber(phoneInfo.e164Number)
    } else {
      this.setState({ phoneNumber: rawPhone })
      this.props.onChangeNumber('')
    }
  }
  updateSuggestions = ({ value }: { value: string; reason: UpdateReasons }) => {
    this.onChangeCountryQuery(value)
  }

  onInputChange = (_, { newValue }: { newValue: string }) => {
    this.onChangeCountryQuery(newValue)
    // use Set Immediate to avoid typing lag
    setImmediate(() => {
      const country = COUNTRIES.getCountry(newValue)
      if (country.displayName) {
        // @ts-ignore -- TS isnt recognizing that Localized country extends Country\
        const countryCode = country.alpha2
        this.setState({
          countryQuery: country.displayName,
          countryCode,
        })
      } else {
        this.setState({
          countryCode: '',
          phoneNumber: '',
        })
        this.props.onChangeNumber('')
      }
    })
  }
  renderSuggestionsContainer = ({ containerProps, children }: SuggestionContainerProps) => {
    const { className, id, ...otherProps } = containerProps
    const isOpen = this.filteredCountries().length > 0

    return (
      <View
        {...otherProps}
        nativeID={id}
        style={[styles.suggestions, isOpen && styles.suggestionsOpen]}
      >
        {children}
      </View>
    )
  }

  renderTextInput = (props: AutoSuggestInputProps) => {
    return (
      <View style={styles.countryInputContainer}>
        <View style={styles.emojiContainer}>
          <Text>{this.getEmoji()}</Text>
        </View>
        <TextInput
          style={[
            standardStyles.input,
            standardStyles.inputDarkMode,
            styles.countryInput,
            this.getEmoji().length && styles.countryInputWithEmoji,
          ]}
          focusStyle={standardStyles.inputDarkFocused}
          {...props}
          value={this.state.countryQuery}
        />
      </View>
    )
  }

  renderItem = (countryCode: string) => {
    // @ts-ignore -- TS isnt recognizing that Localized country extends Country
    const { displayName, emoji } = COUNTRIES.getCountryByCode(countryCode)

    const onPress = () => {
      this.setState({ countryCode, phoneNumber: '' })
      this.onChangeCountryQuery(displayName)
    }

    return (
      <TouchableOpacity onPress={onPress}>
        <View style={[standardStyles.row, styles.item]}>
          <Text>{emoji || `🏳`}</Text>
          <Text style={[fonts.legal, textStyles.invert]}>{displayName}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  render() {
    const inputProps: InputProps = {
      placeholder: this.props.t('countryPlaceholder'),
      value: this.state.countryQuery,
      onChange: this.onInputChange,
      type: 'search',
    }

    return (
      <>
        <style>
          {`
          .react-autosuggest__suggestions-list {
            margin: 0;
            padding-left: 0;
          }

          .react-autosuggest__suggestion {
            list-style-type: none;
          }
          .react-autosuggest__container--open {
            padding: 0;
            border-color: ${colors.white},
            border-width: 1
          }

           .react-autosuggest__suggestion div[data-focusable] {
            border-left: 0;
            transition: border-left 200ms;
          }
          .react-autosuggest__suggestion div:focus {
            outline-width: 0px;
            border-left: 2px solid ${colors.primary};
          }
        `}
        </style>

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
              this.state.countryCode.length > 0 ? textStyles.invert : styles.ccplaceholder,
              textStyles.center,
              styles.countryCode,
            ]}
          >
            {this.getCallingCode() || '+00'}
          </Text>
          <View style={styles.line} />
          <TextInput
            type={'tel'}
            style={[standardStyles.input, standardStyles.inputDarkMode, styles.input]}
            focusStyle={standardStyles.inputDarkFocused}
            name="phone"
            placeholder={this.props.t('phonePlaceholder')}
            onChange={this.onNumberInput}
            value={this.state.phoneNumber}
            editable={this.state.countryCode.length > 0}
          />
        </View>
      </>
    )
  }
}

const getSuggestionValue = (suggestion: string) => {
  return suggestion
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
  countryInputContainer: { flexDirection: 'row', alignItems: 'center' },
  countryInput: { transitionProperty: 'padding', transitionDuration: '200ms' },
  countryInputWithEmoji: { paddingLeft: 40 },
  emojiContainer: { position: 'absolute', left: 15 },
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
    zIndex: 40,
    borderRadius: 2,
  },
  suggestionsOpen: {
    marginBottom: 5,
    borderColor: colors.light,
    borderWidth: 1,
    paddingHorizontal: 1,
    paddingVertical: 5,
  },
  item: {
    marginVertical: 2,
    padding: 5,
    paddingLeft: 10,
    marginHorizontal: 1,
    transitionProperty: 'background',
    transitionDuration: '100ms',
  },
  ccplaceholder: {
    color: colors.placeholderDarkMode,
  },
  container: {
    zIndex: 30,
  },
})

export default withScreenSize<Props>(withNamespaces(NameSpaces.faucet)(PhoneInput))
