import FullscreenCTA from '@celo/react-components/components/FullscreenCTA'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { Text, View } from 'react-native'
import { NavigationParams, NavigationScreenProp } from 'react-navigation'
import { connect } from 'react-redux'
import { requestTxSignature, RequestTxSignatureAction } from 'src/dappkit/dappkit'
import { RootState } from 'src/redux/reducers'
import { parse } from 'url'

interface OwnProps {
  requestTxSignature: (
    txData: string,
    estimatedGas: number,
    from: string,
    to: string,
    nonce: number,
    callback: string
  ) => RequestTxSignatureAction
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
      'Yes!'
    )
  }

  linkBack = () => {
    if (!this.props.navigation) {
      return
    }

    const deeplink: string = this.props.navigation.getParam('url', '')

    console.log(deeplink)

    const query = parse(deeplink, true).query

    if (!query.callback) {
      return
    }

    // @ts-ignore
    this.props.requestTxSignature(
      query.txData,
      parseInt(query.estimatedGas, 10),
      query.from,
      query.to,
      parseInt(query.nonce, 10),
      query.callback
    )
  }

  render() {
    const { t } = this.props
    const errorMessage = this.getErrorMessage()
    return (
      <FullscreenCTA
        CTAText={'Authorize'}
        CTAHandler={this.linkBack}
        title={'Sign TX'}
        subtitle={'Do you want this authorize this transaction'}
      >
        <View>
          <Text style={componentStyles.errorMessage} numberOfLines={10} ellipsizeMode="tail">
            {this.props.navigation.getParam('url', '')}
          </Text>
        </View>
      </FullscreenCTA>
    )
  }
}

const mapStateToProps = (state: RootState) => ({})

const mapDispatchToProps = {
  requestTxSignature,
}

export default withNamespaces('global')(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(DappKitSignTxScreen)
)
