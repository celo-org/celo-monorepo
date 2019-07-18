import Button, { BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { randomBytes } from 'react-native-randombytes'
import { connect } from 'react-redux'
import { setPin } from 'src/account/actions'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import DevSkipButton from 'src/components/DevSkipButton'
import { Namespaces } from 'src/i18n'
import Logo from 'src/icons/Logo'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'

interface StateProps {
  pincodeSet: boolean
}

interface DispatchProps {
  setPin: typeof setPin
}

type Props = StateProps & DispatchProps & WithNamespaces

const mapDispatchToProps = {
  setPin,
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    pincodeSet: state.account.pincodeSet,
  }
}

class SystemAuth extends React.Component<Props> {
  state = {
    isSettingPin: false,
  }

  goToImportWallet = () => {
    navigate(Screens.ImportWallet)
  }

  setupSystemAuth = async () => {
    this.setState({ isSettingPin: true })
    const pin = randomBytes(10).toString('hex')
    await this.props.setPin(pin)
    this.setState({ isSettingPin: false })
  }

  componentDidUpdate() {
    if (this.props.pincodeSet) {
      navigate(Screens.RedeemInvite)
    }
  }

  render() {
    const { t } = this.props
    return (
      <View style={style.pincodeContainer}>
        <DevSkipButton nextScreen={Screens.RedeemInvite} />
        <ScrollView>
          <View style={style.header} />
          <View style={style.pincodeLogo}>
            <Logo />
          </View>
          <View style={style.pincodeContent}>
            <Text style={[fontStyles.h1, style.h1]} testID="SystemAuthTitle">
              {t('systemAuth.title')}
            </Text>
            <View style={style.explanation}>
              <Text style={fontStyles.body}>{t('systemAuth.intro')}</Text>
            </View>
            <Text style={[fontStyles.body, style.explanation]}>{t('systemAuth.why')}</Text>
          </View>
        </ScrollView>
        <View style={style.pincodeFooter}>
          <Button
            text={t('continue')}
            style={style.button}
            onPress={this.setupSystemAuth}
            standard={true}
            type={BtnTypes.SECONDARY}
            disabled={this.state.isSettingPin}
            testID="SystemAuthContinue"
          />
        </View>
      </View>
    )
  }
}

const style = StyleSheet.create({
  pincodeContainer: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'space-between',
  },
  pincodeLogo: {
    paddingTop: 30,
    alignItems: 'center',
    paddingLeft: 20,
  },
  pincodeContent: {
    paddingHorizontal: 25,
  },
  explanation: {
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  pincodeFooter: {
    alignItems: 'center',
  },
  pincodeFooterText: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 35,
  },
  h1: {
    textAlign: 'center',
    color: colors.dark,
    padding: 25,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  header: {
    padding: 20,
    margin: 0,
    flexDirection: 'row',
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    mapDispatchToProps
  )(withNamespaces(Namespaces.nuxNamePin1)(SystemAuth))
)
