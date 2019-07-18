import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import { throttle } from 'lodash'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { NavigationInjectedProps, NavigationScreenProps, withNavigation } from 'react-navigation'
import { connect } from 'react-redux'
import { hideAlert, showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import CancelButton from 'src/components/CancelButton'
import { ERROR_BANNER_DURATION } from 'src/config'
import { Namespaces } from 'src/i18n'
import { E164NumberToAddressType } from 'src/identity/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { storePhoneNumberInRecents } from 'src/send/actions'
import RecipientPicker from 'src/send/RecipientPicker'
import {
  buildRecentRecipients,
  filterRecipientFactory,
  filterRecipients,
  NumberToRecipient,
  Recipient,
  RecipientKind,
  RecipientWithQrCode,
} from 'src/utils/recipient'

interface State {
  loading: boolean
  searchQuery: string
  allRecipients: Recipient[]
  recentRecipients: Recipient[]
  allFiltered: Recipient[]
  recentFiltered: Recipient[]
}

interface StateProps {
  recentPhoneNumbers: string[]
  defaultCountryCode: string
  e164PhoneNumber: string
  devModeActive: boolean
  e164PhoneNumberAddressMapping: E164NumberToAddressType
  recipientCache: NumberToRecipient
}
interface DispatchProps {
  showError: typeof showError
  hideAlert: typeof hideAlert
  storePhoneNumberInRecents: typeof storePhoneNumberInRecents
}

type Props = StateProps & DispatchProps & WithNamespaces & NavigationInjectedProps

const mapStateToProps = (state: RootState): StateProps => ({
  recentPhoneNumbers: state.send.recentPhoneNumbers || [],
  defaultCountryCode: state.account.defaultCountryCode,
  e164PhoneNumber: state.account.e164PhoneNumber,
  devModeActive: state.account.devModeActive || false,
  e164PhoneNumberAddressMapping: state.identity.e164NumberToAddress,
  recipientCache: state.send.recipientCache,
})

// TODO(Rossy) move this into redux as I've done for the full cache (don't forget to blacklist it when you do)
let recentCache: Recipient[] | null = null

const THROTTLE_TIME = 50

const defaultRecipientPhoneNumber = '+10000000000'

// For alfajores-net users to be able to send a small transaction to a sample address (remove post-alfajores)
export const CeloDefaultRecipient: RecipientWithQrCode = {
  address: '0xce10ce10ce10ce10ce10ce10ce10ce10ce10ce10',
  displayName: 'Celo Default Recipient',
  displayPhoneNumber: defaultRecipientPhoneNumber,
  kind: RecipientKind.QrCode,
  e164PhoneNumber: defaultRecipientPhoneNumber,
}

type FilterType = (searchQuery: string) => Recipient[]
class Send extends React.Component<Props, State> {
  static navigationOptions = ({ navigation }: NavigationScreenProps) => ({
    headerTitle: navigation.getParam('title', ''),
    headerTitleStyle: [fontStyles.headerTitle, componentStyles.screenHeader],
    // This helps vertically center the title
    headerRight: <View />,
    headerLeft: <CancelButton eventName={CustomEventNames.send_select_cancel} />,
  })

  throttledSearch: (searchQuery: string) => void
  allRecipientsFilter: FilterType
  recentRecipientsFilter: FilterType

  constructor(props: Props) {
    super(props)

    this.state = {
      loading: true,
      searchQuery: '',
      allRecipients: [],
      recentRecipients: [],
      allFiltered: [],
      recentFiltered: [],
    }

    this.allRecipientsFilter = filterRecipientFactory(this.state.allRecipients)
    this.recentRecipientsFilter = filterRecipientFactory(this.state.recentRecipients)

    this.throttledSearch = throttle((searchQuery: string) => {
      this.setState({
        recentFiltered: this.recentRecipientsFilter(searchQuery),
      })

      this.setState({
        allFiltered: this.allRecipientsFilter(searchQuery),
      })
    }, THROTTLE_TIME)
  }

  updateFilters() {
    this.setState(
      {
        recentRecipients: [CeloDefaultRecipient, ...this.state.recentRecipients],
      },
      () => {
        this.recentRecipientsFilter = filterRecipientFactory(this.state.recentRecipients, false)
        this.onSearchQueryChanged('')
      }
    )

    this.allRecipientsFilter = filterRecipientFactory(this.state.allRecipients, true)
    // end alfajores-net code
  }

  componentDidMount() {
    const { t, recentPhoneNumbers, recipientCache } = this.props
    this.props.navigation.setParams({ title: t('send_or_request') })
    const recipients = Object.values(recipientCache)

    if (recipientCache) {
      if (!recentCache) {
        // TODO do this in import contacts saga
        recentCache = buildRecentRecipients(
          recipients,
          recentPhoneNumbers,
          this.props.t('mobileNumber')
        )
      }

      this.setState(
        {
          loading: false,
          allRecipients: recipients,
          recentRecipients: recentCache,
          allFiltered: filterRecipients(recipients, this.state.searchQuery, true),
          recentFiltered: filterRecipients(recentCache, this.state.searchQuery, false),
        },
        this.updateFilters
      )
    }
  }

  onSearchQueryChanged = (searchQuery: string) => {
    this.props.hideAlert()
    this.setState({
      searchQuery,
    })
    this.throttledSearch(searchQuery)
  }

  onSelectRecipient = (recipient: Recipient) => {
    this.props.hideAlert()
    CeloAnalytics.track(CustomEventNames.send_input, {
      selectedRecipientAddress: recipient.address,
    })
    if (!recipient.e164PhoneNumber) {
      this.props.showError(ErrorMessages.CANT_SELECT_INVALID_PHONE, ERROR_BANNER_DURATION)
      return
    }

    if (recipient.e164PhoneNumber !== defaultRecipientPhoneNumber) {
      this.props.storePhoneNumberInRecents(recipient.e164PhoneNumber)
    }
    navigate(Screens.SendAmount, { recipient })
  }

  render() {
    const { t, defaultCountryCode } = this.props
    const { loading, searchQuery, recentFiltered, allFiltered } = this.state

    const sections = [
      {
        key: t('recent'),
        data: recentFiltered,
      },
      {
        key: t('contacts'),
        data: allFiltered,
      },
    ].filter((section) => section.data.length > 0) // Only show section if there's results

    return (
      <View style={style.body}>
        {loading ? (
          <View style={style.container}>
            <ActivityIndicator style={style.icon} size="large" color={colors.celoGreen} />
            <Text style={[fontStyles.bodySecondary]}>{t('loadingContacts')}</Text>
          </View>
        ) : (
          <RecipientPicker
            sections={sections}
            searchQuery={searchQuery}
            defaultCountryCode={defaultCountryCode}
            onSelectRecipient={this.onSelectRecipient}
            onSearchQueryChanged={this.onSearchQueryChanged}
            showQRCode={true}
          />
        )}
      </View>
    )
  }
}

const style = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  icon: {
    marginBottom: 20,
    height: 60,
    width: 60,
  },
})

export default componentWithAnalytics(
  connect(
    mapStateToProps,
    {
      showError,
      hideAlert,
      storePhoneNumberInRecents,
    }
  )(withNamespaces(Namespaces.sendFlow7)(withNavigation(Send)))
)
