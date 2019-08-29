import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { NavigationInjectedProps, withNavigation } from 'react-navigation'
import { connect } from 'react-redux'
import { defaultCountryCodeSelector } from 'src/account/reducer'
import { hideAlert, showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import i18n, { Namespaces } from 'src/i18n'
import { importContacts } from 'src/identity/actions'
import { e164NumberToAddressSelector, E164NumberToAddressType } from 'src/identity/reducer'
import { headerWithCancelButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { filterRecipients, NumberToRecipient, Recipient } from 'src/recipients/recipient'
import RecipientPicker from 'src/recipients/RecipientPicker'
import { recipientCacheSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'
import { checkContactsPermission } from 'src/utils/androidPermissions'

interface State {
  searchQuery: string
  hasGivenPermission: boolean
}

interface Section {
  key: string
  data: Recipient[]
}

interface StateProps {
  defaultCountryCode: string
  e164PhoneNumberAddressMapping: E164NumberToAddressType
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

type Props = StateProps & DispatchProps & WithNamespaces & NavigationInjectedProps

const mapStateToProps = (state: RootState): StateProps => ({
  defaultCountryCode: defaultCountryCodeSelector(state),
  e164PhoneNumberAddressMapping: e164NumberToAddressSelector(state),
  recipientCache: recipientCacheSelector(state),
})

class Invite extends React.Component<Props, State> {
  static navigationOptions = () => ({
    ...headerWithCancelButton,
    headerTitle: i18n.t('sendFlow7:invite'),
  })

  state: State = { searchQuery: '', hasGivenPermission: true }

  async componentDidMount() {
    const granted = await checkContactsPermission()
    this.setState({ hasGivenPermission: granted })
  }

  updateToField = (value: string) => {
    this.setState({ searchQuery: value })
  }

  onSearchQueryChanged = (searchQuery: string) => {
    this.updateToField(searchQuery)
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

  buildSections = (): Section[] => {
    const { t, recipientCache } = this.props
    // Only recipients without an address are invitable
    const invitableRecipients = Object.values(recipientCache).filter((val) => !val.address)

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

  onPermissionsAccepted = async () => {
    this.props.importContacts()
    this.setState({ hasGivenPermission: true })
  }

  render() {
    return (
      <View style={style.container}>
        <RecipientPicker
          sections={this.buildSections()}
          searchQuery={this.state.searchQuery}
          defaultCountryCode={this.props.defaultCountryCode}
          hasAcceptedContactPermission={this.state.hasGivenPermission}
          onSelectRecipient={this.onSelectRecipient}
          onSearchQueryChanged={this.onSearchQueryChanged}
          showQRCode={false}
          onPermissionsAccepted={this.onPermissionsAccepted}
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
  inviteHeadline: {
    fontSize: 24,
    lineHeight: 39,
    color: colors.dark,
  },
  label: {
    alignSelf: 'center',
    textAlign: 'center',
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    mapDispatchToProps
  )(withNamespaces(Namespaces.sendFlow7)(withNavigation(Invite)))
)
