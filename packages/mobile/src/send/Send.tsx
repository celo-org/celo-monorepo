import VerifyPhone from '@celo/react-components/icons/VerifyPhone'
import colors from '@celo/react-components/styles/colors'
import { StackScreenProps } from '@react-navigation/stack'
import { throttle } from 'lodash'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { connect } from 'react-redux'
import { hideAlert, showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { estimateFee, FeeType } from 'src/fees/actions'
import { Namespaces, withTranslation } from 'src/i18n'
import ContactPermission from 'src/icons/ContactPermission'
import { importContacts } from 'src/identity/actions'
import { ContactMatches } from 'src/identity/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import {
  filterRecipientFactory,
  NumberToRecipient,
  Recipient,
  sortRecipients,
} from 'src/recipients/recipient'
import RecipientPicker from 'src/recipients/RecipientPicker'
import { recipientCacheSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'
import { storeLatestInRecents } from 'src/send/actions'
import { SendCallToAction } from 'src/send/SendCallToAction'
import { SendSearchInput } from 'src/send/SendSearchInput'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { navigateToPhoneSettings } from 'src/utils/linking'
import { requestContactsPermission } from 'src/utils/permissions'

const SEARCH_THROTTLE_TIME = 100

interface Section {
  key: string
  data: Recipient[]
}

type FilterType = (searchQuery: string) => Recipient[]

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
  allRecipients: NumberToRecipient
  matchedContacts: ContactMatches
}

interface DispatchProps {
  showError: typeof showError
  hideAlert: typeof hideAlert
  storeLatestInRecents: typeof storeLatestInRecents
  importContacts: typeof importContacts
  estimateFee: typeof estimateFee
}

type RouteProps = StackScreenProps<StackParamList, Screens.Send>

type Props = StateProps & DispatchProps & WithTranslation & RouteProps

const mapStateToProps = (state: RootState): StateProps => ({
  defaultCountryCode: state.account.defaultCountryCode,
  e164PhoneNumber: state.account.e164PhoneNumber,
  numberVerified: state.app.numberVerified,
  devModeActive: state.account.devModeActive,
  recentRecipients: state.send.recentRecipients,
  allRecipients: recipientCacheSelector(state),
  matchedContacts: state.identity.matchedContacts,
})

const mapDispatchToProps = {
  showError,
  hideAlert,
  storeLatestInRecents,
  importContacts,
  estimateFee,
}

class Send extends React.Component<Props, State> {
  throttledSearch!: (searchQuery: string) => void
  allRecipientsFilter!: FilterType
  recentRecipientsFilter!: FilterType

  constructor(props: Props) {
    super(props)

    this.state = {
      searchQuery: '',
      allFiltered: sortRecipients(
        Object.values(this.props.allRecipients),
        this.props.matchedContacts
      ),
      recentFiltered: this.props.recentRecipients,
      hasGivenContactPermission: true,
    }

    this.createRecipientSearchFilters(true, true)
  }

  async componentDidMount() {
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
      this.createRecipientSearchFilters(
        recentRecipients !== prevPops.recentRecipients,
        allRecipients !== prevPops.allRecipients
      )
      // Clear search when recipients change to avoid tricky states
      this.onSearchQueryChanged('')
    }
  }

  createRecipientSearchFilters = (updateRecentFilter: boolean, updateAllFilter: boolean) => {
    // To improve search performance, we use these filter factories which pre-process the
    // recipient lists to improve search performance
    if (updateRecentFilter) {
      this.recentRecipientsFilter = filterRecipientFactory(this.props.recentRecipients, false)
    }
    if (updateAllFilter) {
      this.allRecipientsFilter = filterRecipientFactory(
        Object.values(this.props.allRecipients),
        true,
        this.props.matchedContacts
      )
    }

    this.throttledSearch = throttle((searchQuery: string) => {
      this.setState({
        searchQuery,
        recentFiltered: this.recentRecipientsFilter(searchQuery),
        allFiltered: this.allRecipientsFilter(searchQuery),
      })
    }, SEARCH_THROTTLE_TIME)
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
    this.throttledSearch(searchQuery)
  }

  onSelectRecipient = (recipient: Recipient) => {
    this.props.hideAlert()
    const isRequest = this.props.route.params?.isRequest ?? false

    if (!recipient.e164PhoneNumber && !recipient.address) {
      this.props.showError(ErrorMessages.CANT_SELECT_INVALID_PHONE)
      return
    }

    this.props.storeLatestInRecents(recipient)

    CeloAnalytics.track(
      isRequest
        ? CustomEventNames.request_select_recipient
        : CustomEventNames.send_select_recipient,
      {
        recipientKind: recipient.kind,
        didQuery: this.state.searchQuery.length > 0,
      }
    )

    navigate(Screens.SendAmount, { recipient, isRequest })
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

export default connect<StateProps, DispatchProps, {}, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation(Namespaces.sendFlow7)(Send))
