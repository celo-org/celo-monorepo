import FullscreenCTA from '@celo/react-components/components/FullscreenCTA'
import { componentStyles } from '@celo/react-components/styles/styles'
import { SignTxRequest } from '@celo/utils/src/dappkit'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { Text, View } from 'react-native'
import { NavigationParams, NavigationScreenProp } from 'react-navigation'
import { connect } from 'react-redux'
import { requestTxSignature, RequestTxSignatureAction } from 'src/dappkit/dappkit'
import { Namespaces } from 'src/i18n'
import { RootState } from 'src/redux/reducers'

interface OwnProps {
  requestTxSignature: (request: SignTxRequest) => RequestTxSignatureAction
  errorMessage?: string
  navigation?: NavigationScreenProp<NavigationParams>
}

type Props = OwnProps & WithNamespaces

const mapStateToProps = (state: RootState) => ({})

const mapDispatchToProps = {
  requestTxSignature,
}

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
      return
    }

    const request: SignTxRequest = this.props.navigation.getParam('dappKitRequest', null)

    if (request === null) {
      return
    }

    // @ts-ignore
    this.props.requestTxSignature(request)
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

export default withNamespaces(Namespaces.global)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(DappKitSignTxScreen)
)
