import QRCodeBorderlessIcon from '@celo/react-components/icons/QRCodeBorderless'
import Times from '@celo/react-components/icons/Times'
import VerifyPhone from '@celo/react-components/icons/VerifyPhone'
import colors from '@celo/react-components/styles/colors.v2'
import { RouteProp } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import { throttle } from 'lodash'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { connect } from 'react-redux'
import { hideAlert, showError } from 'src/alert/actions'
import { RequestEvents, SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { estimateFee, FeeType } from 'src/fees/actions'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import ContactPermission from 'src/icons/ContactPermission'
import { importContacts } from 'src/identity/actions'
import { ContactMatches } from 'src/identity/types'
import { emptyHeader } from 'src/navigator/Headers.v2'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton.v2'
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
  defaultCountryCode: string | null
  e164PhoneNumber: string | null
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

export const sendScreenNavOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.Send>
}) => {
  const goQr = () => navigate(Screens.QRNavigator)
  const title = route.params?.isRequest
    ? i18n.t('paymentRequestFlow:request')
    : i18n.t('sendFlow7:send')

  return {
    ...emptyHeader,
    headerLeft: () => (
      <TopBarIconButton
        icon={<Times />}
        onPress={navigateBack}
        eventName={route.params?.isRequest ? RequestEvents.request_cancel : SendEvents.send_cancel}
      />
    ),
    headerLeftContainerStyle: styles.headerLeftContainer,
    headerRight: () => (
      <TopBarIconButton
        icon={<QRCodeBorderlessIcon height={32} color={colors.greenUI} />}
        eventName={route.params?.isRequest ? RequestEvents.request_scan : SendEvents.send_scan}
        onPress={goQr}
      />
    ),
    headerRightContainerStyle: styles.headerRightContainer,
    headerTitle: title,
  }
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

  componentDidUpdate(prevProps: Props) {
    const { recentRecipients, allRecipients } = this.props

    if (
      recentRecipients !== prevProps.recentRecipients ||
      allRecipients !== prevProps.allRecipients
    ) {
      this.createRecipientSearchFilters(
        recentRecipients !== prevProps.recentRecipients,
        allRecipients !== prevProps.allRecipients
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
    this.props.importContacts()
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

    ValoraAnalytics.track(
      isRequest ? RequestEvents.request_select_recipient : SendEvents.send_select_recipient,
      {
        recipientKind: recipient.kind,
        usedSearchBar: this.state.searchQuery.length > 0,
      }
    )

    navigate(Screens.SendAmount, { recipient, isRequest })
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
    const { defaultCountryCode } = this.props
    const { searchQuery } = this.state

    return (
      // Intentionally not using SafeAreaView here as RecipientPicker
      // needs fullscreen rendering
      <View style={styles.body}>
        <DisconnectBanner />
        <SendSearchInput onChangeText={this.onSearchQueryChanged} />
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

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerLeftContainer: {
    paddingLeft: 16,
  },
  headerRightContainer: {
    paddingRight: 16,
  },
})

export default connect<StateProps, DispatchProps, {}, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation<Props>(Namespaces.sendFlow7)(Send))
