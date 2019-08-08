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
import { importContacts } from 'src/identity/actions'
import { E164NumberToAddressType } from 'src/identity/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { storeLatestInRecents } from 'src/send/actions'
import RecipientPicker from 'src/send/RecipientPicker'
import { checkContactsPermission } from 'src/utils/androidPermissions'
import {
  buildRecentRecipients,
  filterRecipientFactory,
  filterRecipients,
  NumberToRecipient,
  Recipient,
  RecipientKind,
  RecipientWithQrCode,
} from 'src/utils/recipient'

interface Section {
  key: string
  data: Recipient[]
}

interface State {
  loading: boolean
  searchQuery: string
  allRecipients: Recipient[]
  recentRecipients: Recipient[]
  allFiltered: Recipient[]
  recentFiltered: Recipient[]
  hasGivenPermission: boolean
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
  storeLatestInRecents: typeof storeLatestInRecents
  importContacts: typeof importContacts
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

const mapDispatchToProps = {
  showError,
  hideAlert,
  storeLatestInRecents,
  importContacts,
}

// TODO(Rossy) move this into redux as I've done for the full cache (don't forget to blacklist it when you do)
let recentCache: Recipient[] | null = null

const THROTTLE_TIME = 50

const defaultRecipientPhoneNumber = '+10000000000'
const defaultRecipientAddress = `0xce10ce10ce10ce10ce10ce10ce10ce10ce10ce10`

// For alfajores-net users to be able to send a small transaction to a sample address (remove post-alfajores)
export const CeloDefaultRecipient: RecipientWithQrCode = {
  address: defaultRecipientAddress,
  displayName: 'Celo Default Recipient',
  displayId: defaultRecipientPhoneNumber,
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
      hasGivenPermission: true,
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
    const recentRecipients = this.props.devModeActive
      ? [CeloDefaultRecipient, ...this.state.recentRecipients]
      : this.state.recentRecipients

    this.setState({ recentRecipients }, () => {
      this.recentRecipientsFilter = filterRecipientFactory(this.state.recentRecipients, false)
      this.onSearchQueryChanged('')
    })

    this.allRecipientsFilter = filterRecipientFactory(this.state.allRecipients, true)
    // end alfajores-net code
  }

  async componentDidMount() {
    const { t, recentPhoneNumbers, recipientCache } = this.props
    this.props.navigation.setParams({ title: t('send_or_request') })
    const recipients = Object.values(recipientCache)

    if (recipientCache) {
      if (!recentCache) {
        // TODO do this in import contacts saga
        recentCache = buildRecentRecipients(
          recipients,
          recentPhoneNumbers,
          this.props.t('mobileNumber'),
          this.props.t('walletAddress')
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

      const hasGivenPermission = await checkContactsPermission()
      this.setState({ hasGivenPermission })
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
    if (!recipient.e164PhoneNumber && !recipient.address) {
      this.props.showError(ErrorMessages.CANT_SELECT_INVALID_PHONE, ERROR_BANNER_DURATION)
      return
    }

    if (recipient.e164PhoneNumber && recipient.e164PhoneNumber !== defaultRecipientPhoneNumber) {
      this.props.storeLatestInRecents(recipient.e164PhoneNumber)
    }

    if (recipient.address && recipient.address !== defaultRecipientAddress) {
      this.props.storeLatestInRecents(recipient.address)
    }
    navigate(Screens.SendAmount, { recipient })
  }

  onPermissionsAccepted = async () => {
    this.props.importContacts()
    this.setState(
      {
        searchQuery: '',
        recentRecipients: [],
        hasGivenPermission: true,
      },
      this.updateFilters
    )
  }

  buildSections = (): Section[] => {
    const { t, recipientCache } = this.props
    const allRecipients = Object.values(recipientCache)

    const queryRecipients = filterRecipients(allRecipients, this.state.searchQuery)

    const { recentFiltered } = this.state
    const sections = [
      { key: t('recent'), data: recentFiltered },
      { key: t('contacts'), data: Object.values(queryRecipients) },
    ].filter((section) => section.data.length > 0)

    return sections
  }

  render() {
    const { t, defaultCountryCode } = this.props
    const { loading, searchQuery } = this.state

    return (
      <View style={style.body}>
        {loading ? (
          <View style={style.container}>
            <ActivityIndicator style={style.icon} size="large" color={colors.celoGreen} />
            <Text style={[fontStyles.bodySecondary]}>{t('loadingContacts')}</Text>
          </View>
        ) : (
          <RecipientPicker
            sections={this.buildSections()}
            searchQuery={searchQuery}
            defaultCountryCode={defaultCountryCode}
            hasAcceptedContactPermission={this.state.hasGivenPermission}
            onSelectRecipient={this.onSelectRecipient}
            onSearchQueryChanged={this.onSearchQueryChanged}
            showQRCode={true}
            onPermissionsAccepted={this.onPermissionsAccepted}
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
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    mapDispatchToProps
  )(withNamespaces(Namespaces.sendFlow7)(withNavigation(Send)))
)
