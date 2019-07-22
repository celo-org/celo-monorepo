import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import componentWithAnalytics from 'src/analytics/wrapper'
import DevSkipButton from 'src/components/DevSkipButton'
import NuxLogo from 'src/icons/NuxLogo'
import { navigate } from 'src/navigator/NavigationService'
import { Screens, Stacks } from 'src/navigator/Screens'

export class Verified extends React.PureComponent<WithNamespaces> {
  static navigationOptions = {
    header: null,
  }

  componentDidMount() {
    // And then another to show success text before leaving screen
    setTimeout(() => {
      navigate(Stacks.AppStack)
    }, 2000)
  }

  render() {
    const { t } = this.props
    return (
      <View style={style.container}>
        <DevSkipButton nextScreen={Screens.WalletHome} />
        <NuxLogo testID="VerifyLogo" />
        <Text style={[fontStyles.h1, style.congrats]}>{t('congratsVerified')}</Text>
      </View>
    )
  }
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: colors.background,
  },
  congrats: {
    marginVertical: 20,
    paddingHorizontal: 40,
  },
})

export default componentWithAnalytics(withNamespaces('nuxVerification2')(Verified))
