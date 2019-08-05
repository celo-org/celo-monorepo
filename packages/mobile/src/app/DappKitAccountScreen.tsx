import FullscreenCTA from '@celo/react-components/components/FullscreenCTA'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { Linking, Text, View } from 'react-native'
import { NavigationParams, NavigationScreenProp } from 'react-navigation'
import { connect } from 'react-redux'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { parse } from 'url'

interface OwnProps {
  account: string
  errorMessage?: string
  navigation?: NavigationScreenProp<NavigationParams>
}

type Props = OwnProps & WithNamespaces

class DappKitAccountAuthScreen extends React.Component<Props> {
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

    const callback: string = parse(deeplink, true).query.callback
    if (!callback) {
      return
    }

    navigate(Screens.WalletHome)
    console.log(callback)
    Linking.openURL(callback + '?account=' + this.props.account)
  }

  render() {
    const { t } = this.props
    const errorMessage = this.getErrorMessage()
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

const mapStateToProps = (state: RootState) => ({
  account: state.web3.account,
})

export default withNamespaces('global')(connect(mapStateToProps)(DappKitAccountAuthScreen))
