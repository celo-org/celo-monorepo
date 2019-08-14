import FullscreenCTA from '@celo/react-components/components/FullscreenCTA'
import { componentStyles } from '@celo/react-components/styles/styles'
import {
  AccountAuthRequest,
  AccountAuthResponseSuccess,
  produceResponseDeeplink,
} from '@celo/utils/src/dappkit'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { Linking, Text, View } from 'react-native'
import { NavigationParams, NavigationScreenProp } from 'react-navigation'
import { connect } from 'react-redux'
import { Namespaces } from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'dappkit/DappKitAccountScreen'

interface OwnProps {
  errorMessage?: string
  navigation?: NavigationScreenProp<NavigationParams>
}

interface StateProps {
  account: string | null
}

type Props = OwnProps & StateProps & WithNamespaces

const mapStateToProps = (state: RootState): StateProps => ({
  account: currentAccountSelector(state),
})

class DappKitAccountAuthScreen extends React.Component<Props> {
  static navigationOptions = { header: null }

  getErrorMessage() {
    return (
      this.props.errorMessage ||
      (this.props.navigation && this.props.navigation.getParam('errorMessage')) ||
      ''
    )
  }

  linkBack = () => {
    const { account, navigation } = this.props

    if (!navigation) {
      Logger.error(TAG, 'Missing navigation props')
      return
    }

    const request: AccountAuthRequest = navigation.getParam('dappKitRequest', null)

    if (!request) {
      Logger.error(TAG, 'No request found in navigation props')
      return
    }

    if (!account) {
      Logger.error(TAG, 'No account set up for this wallet')
      return
    }

    navigate(Screens.WalletHome)
    Linking.openURL(produceResponseDeeplink(request, AccountAuthResponseSuccess(account)))
  }

  render() {
    return (
      <FullscreenCTA
        CTAText={'Authorize'}
        CTAHandler={this.linkBack}
        title={'Account Auth'}
        subtitle={'Do you want this to authorize the app with your account?'}
      >
        <View>
          <Text style={componentStyles.errorMessage} numberOfLines={10} ellipsizeMode="tail">
            {this.props.account}
          </Text>
        </View>
      </FullscreenCTA>
    )
  }
}

export default withNamespaces(Namespaces.global)(
  connect<StateProps, null, {}, RootState>(mapStateToProps)(DappKitAccountAuthScreen)
)
