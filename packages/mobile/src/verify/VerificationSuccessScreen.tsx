import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { Namespaces, withTranslation } from 'src/i18n'
import DancingRings from 'src/icons/DancingRings'
import { navigateHome } from 'src/navigator/NavigationService'

export class VerificationSuccessScreen extends React.Component<WithTranslation> {
  static navigationOptions = { header: null }

  state = {
    isTextWhite: false,
  }

  componentDidMount() {
    setTimeout(() => this.setState({ isTextWhite: true }), 2000)
  }

  onAnimationFinish = () => {
    navigateHome()
  }

  render() {
    const { t } = this.props
    return (
      <View style={styles.container}>
        <Text style={[styles.header, this.state.isTextWhite ? styles.whiteText : undefined]}>
          {t('congratsVerified')}
        </Text>
        <DancingRings onAnimationFinish={this.onAnimationFinish} />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    ...fontStyles.h1,
    position: 'absolute',
    top: '45%',
    zIndex: 100,
    paddingHorizontal: 50,
  },
  whiteText: {
    color: '#FFF',
  },
})

export default withTranslation(Namespaces.nuxVerification2)(VerificationSuccessScreen)
