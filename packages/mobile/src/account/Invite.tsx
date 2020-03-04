import TextInput, { TextInputProps } from '@celo/react-components/components/TextInput'
import withTextInputLabeling from '@celo/react-components/components/WithTextInputLabeling'
import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import { defaultCountryCodeSelector } from 'src/account/selectors'
import { hideAlert, showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import ContactPermission from 'src/icons/ContactPermission'
import Search from 'src/icons/Search'
import { importContacts } from 'src/identity/actions'
import { headerWithCancelButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { filterRecipients, NumberToRecipient, Recipient } from 'src/recipients/recipient'
import RecipientPicker from 'src/recipients/RecipientPicker'
import { recipientCacheSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'
import { SendCallToAction } from 'src/send/SendCallToAction'
import { navigateToPhoneSettings } from 'src/utils/linking'
import { requestContactsPermission } from 'src/utils/permissions'

const InviteSearchInput = withTextInputLabeling<TextInputProps>(TextInput)

interface State {
  searchQuery: string
  hasGivenContactPermission: boolean
}

interface Section {
  key: string
  data: Recipient[]
}

interface StateProps {
  defaultCountryCode: string
  recipientCache: NumberToRecipient
}

interface DispatchProps {
  showError: typeof showError
  hideAlert: typeof hideAlert
  importContacts: typeof importContacts
}

const mapDispatchToProps = {
  showError,
  hideAlert,
  importContacts,
}

type Props = StateProps & DispatchProps & WithTranslation & NavigationInjectedProps

const mapStateToProps = (state: RootState): StateProps => ({
  defaultCountryCode: defaultCountryCodeSelector(state),
  recipientCache: recipientCacheSelector(state),
})

class Invite extends React.Component<Props, State> {
  static navigationOptions = () => ({
    ...headerWithCancelButton,
    headerTitle: i18n.t('sendFlow7:invite'),
  })

  state: State = { searchQuery: '', hasGivenContactPermission: true }

  async componentDidMount() {
    await this.tryImportContacts()
  }

  tryImportContacts = async () => {
    const { recipientCache } = this.props

    // If we've imported already
    if (Object.keys(recipientCache).length) {
      return
    }

    const hasGivenContactPermission = await requestContactsPermission()
    this.setState({ hasGivenContactPermission })

    if (hasGivenContactPermission) {
      this.props.importContacts()
    }
  }

  onSearchQueryChanged = (searchQuery: string) => {
    this.setState({ searchQuery })
  }

  onSelectRecipient = (recipient: Recipient) => {
    this.props.hideAlert()
    if (recipient.e164PhoneNumber) {
      CeloAnalytics.track(CustomEventNames.friend_invited)
      navigate(Screens.InviteReview, { recipient })
    } else {
      this.props.showError(ErrorMessages.CANT_SELECT_INVALID_PHONE)
    }
  }

  onPressContactsSettings = () => {
    navigateToPhoneSettings()
  }

  buildSections = (): Section[] => {
    const { t, recipientCache } = this.props
    // Only recipients without an address are invitable
    const invitableRecipients = Object.values(recipientCache)
      .filter((val) => !val.address)
      .sort(({ displayName: a }, { displayName: b }) => (b > a ? -1 : 1))

    const queryRecipients = (recipients: Recipient[]) =>
      filterRecipients(recipients, this.state.searchQuery)

    const sectionInputs = [{ title: t('contacts'), recipients: Object.values(invitableRecipients) }]
    return sectionInputs
      .map((input) => ({
        key: input.title,
        data: queryRecipients(input.recipients),
      }))
      .filter((section) => section.data.length > 0)
  }
  renderListHeader = () => {
    const { t } = this.props
    const { hasGivenContactPermission } = this.state

    if (hasGivenContactPermission) {
      return null
    }

    return (
      <SendCallToAction
        icon={<ContactPermission />}
        header={t('importContactsCta.header')}
        body={t('importContactsCta.body')}
        cta={t('importContactsCta.cta')}
        onPressCta={this.onPressContactsSettings}
      />
    )
  }

  render() {
    return (
      // Intentionally not using SafeAreaView here as RecipientPicker
      // needs fullscreen rendering
      <View style={style.container}>
        <View style={style.textInputContainer}>
          <InviteSearchInput
            value={this.state.searchQuery}
            onChangeText={this.onSearchQueryChanged}
            icon={<Search />}
            placeholder={this.props.t('nameOrPhoneNumber')}
          />
        </View>
        <RecipientPicker
          testID={'RecipientPicker'}
          sections={this.buildSections()}
          searchQuery={this.state.searchQuery}
          defaultCountryCode={this.props.defaultCountryCode}
          onSelectRecipient={this.onSelectRecipient}
          listHeaderComponent={this.renderListHeader}
        />
      </View>
    )
  }
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  textInputContainer: {
    paddingBottom: 5,
    borderBottomColor: colors.listBorder,
    borderBottomWidth: 1,
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    mapDispatchToProps
  )(withTranslation(Namespaces.sendFlow7)(Invite))
)
