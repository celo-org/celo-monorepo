import FullscreenCTA from '@celo/react-components/components/FullscreenCTA'
import { componentStyles } from '@celo/react-components/styles/styles'
import { SignTxRequest } from '@celo/utils/src/dappkit'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { Text, View } from 'react-native'
import { NavigationParams, NavigationScreenProp } from 'react-navigation'
import { requestTxSignature } from 'src/dappkit/dappkit'
import { Namespaces } from 'src/i18n'
import { navigateHome } from 'src/navigator/NavigationService'
import Logger from 'src/utils/Logger'

const TAG = 'dappkit/DappKitSignTxScreen'

interface OwnProps {
  errorMessage?: string
  navigation?: NavigationScreenProp<NavigationParams>
}

type Props = OwnProps & WithNamespaces

class DappKitSignTxScreen extends React.Component<Props> {
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
      Logger.error(TAG, 'Missing navigation props')
      return
    }

    const request: SignTxRequest = this.props.navigation.getParam('dappKitRequest', null)

    if (!request) {
      Logger.error(TAG, 'No request found in navigation props')
      return
    }

    navigateHome({ dispatchAfterNavigate: requestTxSignature(request) })
  }

  render() {
    return (
      <FullscreenCTA
        CTAText={'Authorize'}
        CTAHandler={this.linkBack}
        title={'Sign TX'}
        subtitle={'Do you want this authorize this transaction'}
      >
        <View>
          <Text style={componentStyles.errorMessage} numberOfLines={10} ellipsizeMode="tail">
            Dapp
          </Text>
        </View>
      </FullscreenCTA>
    )
  }
}

export default withNamespaces(Namespaces.global)(DappKitSignTxScreen)
