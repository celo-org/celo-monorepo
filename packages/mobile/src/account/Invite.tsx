import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { NavigationInjectedProps, NavigationScreenProps, withNavigation } from 'react-navigation'
import { connect } from 'react-redux'
import { defaultCountryCodeSelector } from 'src/account/reducer'
import { hideAlert, showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import CancelButton from 'src/components/CancelButton'
import { ERROR_BANNER_DURATION } from 'src/config'
import { Namespaces } from 'src/i18n'
import { e164NumberToAddressSelector, E164NumberToAddressType } from 'src/identity/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import RecipientPicker from 'src/send/RecipientPicker'
import { recipientCacheSelector } from 'src/send/reducers'
import { filterRecipients, NumberToRecipient, Recipient } from 'src/utils/recipient'

interface State {
  searchQuery: string
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
}

type Props = StateProps & DispatchProps & WithNamespaces & NavigationInjectedProps

const mapStateToProps = (state: RootState): StateProps => ({
  defaultCountryCode: defaultCountryCodeSelector(state),
  e164PhoneNumberAddressMapping: e164NumberToAddressSelector(state),
  recipientCache: recipientCacheSelector(state),
})

class Invite extends React.Component<Props, State> {
  static navigationOptions = ({ navigation }: NavigationScreenProps) => ({
    headerStyle: {
      elevation: 0,
    },
    headerTitle: navigation.getParam('title', ''),
    headerTitleStyle: [fontStyles.headerTitle, componentStyles.screenHeader],
    headerRight: <View />, // This helps vertically center the title
    headerLeft: <CancelButton eventName={CustomEventNames.invite_cancel} />,
  })

  state: State = {
    searchQuery: '',
  }

  async componentDidMount() {
    this.props.navigation.setParams({ title: this.props.t('invite') })
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
      this.props.showError(ErrorMessages.CANT_SELECT_INVALID_PHONE, ERROR_BANNER_DURATION)
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

  render() {
    return (
      <View style={style.container}>
        <RecipientPicker
          sections={this.buildSections()}
          searchQuery={this.state.searchQuery}
          defaultCountryCode={this.props.defaultCountryCode}
          onSelectRecipient={this.onSelectRecipient}
          onSearchQueryChanged={this.onSearchQueryChanged}
          showQRCode={false}
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
  connect(
    mapStateToProps,
    {
      showError,
      hideAlert,
    }
  )(withNamespaces(Namespaces.sendFlow7)(withNavigation(Invite)))
)
