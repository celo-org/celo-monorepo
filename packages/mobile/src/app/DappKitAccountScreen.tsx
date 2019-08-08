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

interface OwnProps {
  account: string
  errorMessage?: string
  navigation?: NavigationScreenProp<NavigationParams>
}

type Props = OwnProps & WithNamespaces

const mapStateToProps = (state: RootState) => ({
  account: state.web3.account,
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
    if (!this.props.navigation) {
      return
    }

    const request: AccountAuthRequest = this.props.navigation.getParam('dappKitRequest', null)

    if (request === null) {
      return
    }

    navigate(Screens.WalletHome)
    Linking.openURL(
      produceResponseDeeplink(request, AccountAuthResponseSuccess(this.props.account))
    )
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

export default withNamespaces(Namespaces.global)(connect(mapStateToProps)(DappKitAccountAuthScreen))
