import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { Namespaces } from 'src/i18n'
import DancingRings from 'src/icons/DancingRings'
import { navigate } from 'src/navigator/NavigationService'
import { Stacks } from 'src/navigator/Screens'

export class VerificationSuccessScreen extends React.Component<WithNamespaces> {
  static navigationOptions = { header: null }

  state = {
    isTextWhite: false,
  }

  componentDidMount() {
    setTimeout(() => this.setState({ isTextWhite: true }), 2000)
  }

  onAnimationFinish = () => {
    navigate(Stacks.AppStack)
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

export default withNamespaces(Namespaces.nuxVerification2)(VerificationSuccessScreen)
