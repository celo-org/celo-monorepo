import VerifyPhone from '@celo/react-components/icons/VerifyPhone'
import colors from '@celo/react-components/styles/colors'
import { throttle } from 'lodash'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import { hideAlert, showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { estimateFee, FeeType } from 'src/fees/actions'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import ContactPermission from 'src/icons/ContactPermission'
import { importContacts } from 'src/identity/actions'
import { headerWithCancelButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import {
  filterRecipientFactory,
  filterRecipients,
  Recipient,
  RecipientKind,
  RecipientWithQrCode,
} from 'src/recipients/recipient'
import RecipientPicker from 'src/recipients/RecipientPicker'
import { recipientCacheSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'
import { storeLatestInRecents } from 'src/send/actions'
import { QRCodeIcon } from 'src/send/QRCodeIcon'
import { SendCallToAction } from 'src/send/SendCallToAction'
import { SendSearchInput } from 'src/send/SendSearchInput'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { navigateToPhoneSettings } from 'src/utils/linking'
import { requestContactsPermission } from 'src/utils/permissions'

const SEARCH_THROTTLE_TIME = 50
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

interface Section {
  key: string
  data: Recipient[]
}

interface State {
  searchQuery: string
  allFiltered: Recipient[]
  recentFiltered: Recipient[]
  hasGivenContactPermission: boolean
}

interface StateProps {
  defaultCountryCode: string
  e164PhoneNumber: string
  numberVerified: boolean
  devModeActive: boolean
  recentRecipients: Recipient[]
  allRecipients: Recipient[]
}

interface DispatchProps {
  showError: typeof showError
  hideAlert: typeof hideAlert
  storeLatestInRecents: typeof storeLatestInRecents
  importContacts: typeof importContacts
  estimateFee: typeof estimateFee
}

type Props = StateProps & DispatchProps & WithTranslation & NavigationInjectedProps

const mapStateToProps = (state: RootState): StateProps => ({
  defaultCountryCode: state.account.defaultCountryCode,
  e164PhoneNumber: state.account.e164PhoneNumber,
  numberVerified: state.app.numberVerified,
  devModeActive: state.account.devModeActive || false,
  recentRecipients: state.account.devModeActive
    ? [CeloDefaultRecipient, ...state.send.recentRecipients]
    : state.send.recentRecipients,
  allRecipients: Object.values(recipientCacheSelector(state)),
})

const mapDispatchToProps = {
  showError,
  hideAlert,
  storeLatestInRecents,
  importContacts,
  estimateFee,
}

type FilterType = (searchQuery: string) => Recipient[]

class Send extends React.Component<Props, State> {
  static navigationOptions = () => ({
    ...headerWithCancelButton,
    headerTitle: i18n.t('sendFlow7:sendOrRequest'),
    headerRight: <QRCodeIcon />,
  })

  throttledSearch: (searchQuery: string) => void
  allRecipientsFilter: FilterType
  recentRecipientsFilter: FilterType

  constructor(props: Props) {
    super(props)

    this.state = {
      searchQuery: '',
      allFiltered: [],
      recentFiltered: [],
      hasGivenContactPermission: true,
    }

    this.allRecipientsFilter = filterRecipientFactory(this.props.allRecipients)
    this.recentRecipientsFilter = filterRecipientFactory(this.props.recentRecipients)

    this.throttledSearch = throttle((searchQuery: string) => {
      this.setState({
        recentFiltered: this.recentRecipientsFilter(searchQuery),
        allFiltered: this.allRecipientsFilter(searchQuery),
      })
    }, SEARCH_THROTTLE_TIME)
  }

  async componentDidMount() {
    const { recentRecipients, allRecipients } = this.props

    this.setState({
      recentFiltered: filterRecipients(recentRecipients, this.state.searchQuery, false),
      allFiltered: filterRecipients(allRecipients, this.state.searchQuery, true),
    })

    await this.tryImportContacts()

    // Trigger a fee estimation so it'll likely be finished and cached
    // when SendAmount screen is shown
    this.props.estimateFee(FeeType.SEND)
  }

  componentDidUpdate(prevPops: Props) {
    const { recentRecipients, allRecipients } = this.props

    if (
      recentRecipients !== prevPops.recentRecipients ||
      allRecipients !== prevPops.allRecipients
    ) {
      this.setState({
        recentFiltered: filterRecipients(recentRecipients, this.state.searchQuery, false),
        allFiltered: filterRecipients(allRecipients, this.state.searchQuery, true),
      })
    }
  }

  tryImportContacts = async () => {
    const { numberVerified, allRecipients } = this.props

    // Only import contacts if number is verified and
    // recip cache is empty so we haven't already
    if (!numberVerified || allRecipients.length) {
      return
    }

    const hasGivenContactPermission = await requestContactsPermission()
    this.setState({ hasGivenContactPermission })

    if (hasGivenContactPermission) {
      this.props.importContacts()
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
      this.props.showError(ErrorMessages.CANT_SELECT_INVALID_PHONE)
      return
    }

    if (
      (recipient.e164PhoneNumber && recipient.e164PhoneNumber !== defaultRecipientPhoneNumber) ||
      (recipient.address && recipient.address !== defaultRecipientAddress)
    ) {
      this.props.storeLatestInRecents(recipient)
    }

    navigate(Screens.SendAmount, { recipient })
  }

  onPermissionsAccepted = async () => {
    this.props.importContacts()
    this.setState({
      searchQuery: '',
      hasGivenContactPermission: true,
    })
  }

  onPressStartVerification = () => {
    navigate(Screens.VerificationEducationScreen)
  }

  onPressContactsSettings = () => {
    navigateToPhoneSettings()
  }

  buildSections = (): Section[] => {
    const { t } = this.props
    const { recentFiltered, allFiltered } = this.state
    const sections = [
      { key: t('recent'), data: recentFiltered },
      { key: t('contacts'), data: allFiltered },
    ].filter((section) => section.data.length > 0)

    return sections
  }

  renderListHeader = () => {
    const { t, numberVerified } = this.props
    const { hasGivenContactPermission } = this.state

    return (
      <>
        {!numberVerified && (
          <SendCallToAction
            icon={<VerifyPhone height={49} />}
            header={t('verificationCta.header')}
            body={t('verificationCta.body')}
            cta={t('verificationCta.cta')}
            onPressCta={this.onPressStartVerification}
          />
        )}
        {numberVerified && !hasGivenContactPermission && (
          <SendCallToAction
            icon={<ContactPermission />}
            header={t('importContactsCta.header')}
            body={t('importContactsCta.body')}
            cta={t('importContactsCta.cta')}
            onPressCta={this.onPressContactsSettings}
          />
        )}
      </>
    )
  }

  render() {
    const { defaultCountryCode, numberVerified } = this.props
    const { searchQuery } = this.state

    return (
      // Intentionally not using SafeAreaView here as RecipientPicker
      // needs fullscreen rendering
      <View style={style.body}>
        <DisconnectBanner />
        <SendSearchInput isPhoneEnabled={numberVerified} onChangeText={this.onSearchQueryChanged} />
        <RecipientPicker
          testID={'RecipientPicker'}
          sections={this.buildSections()}
          searchQuery={searchQuery}
          defaultCountryCode={defaultCountryCode}
          listHeaderComponent={this.renderListHeader}
          onSelectRecipient={this.onSelectRecipient}
        />
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
  )(withTranslation(Namespaces.sendFlow7)(Send))
)
