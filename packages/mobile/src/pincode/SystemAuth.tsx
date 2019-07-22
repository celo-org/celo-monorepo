import Button, { BtnTypes } from '@celo/react-components/components/Button'
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
import BackupIcon from 'src/icons/BackupIcon'
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
      this.nextScreen()
    }
  }

  nextScreen() {
    navigate(Screens.EnterInviteCode)
  }
  render() {
    const { t } = this.props
    return (
      <View style={style.pincodeContainer}>
        <DevSkipButton nextScreen={Screens.EnterInviteCode} />
        <ScrollView>
          <View style={style.header} />
          <View>
            <BackupIcon style={style.pincodeLogo} />
            <Text style={[fontStyles.h1, style.h1]} testID="SystemAuthTitle">
              {t('systemAuth.title')}
            </Text>
            <Text style={[fontStyles.bodySmall, style.explanation]}>{t('systemAuth.secure')}</Text>
            <Text style={[fontStyles.bodySmall, style.explanation]}>{t('systemAuth.intro')}</Text>
            <Text style={[fontStyles.bodySmall, style.explanation]}>{t('systemAuth.why')}</Text>
          </View>
        </ScrollView>
        <View style={style.pincodeFooter}>
          <Button
            text={this.props.pincodeSet ? t('continue') : t('enableSecurity')}
            onPress={this.props.pincodeSet ? this.nextScreen : this.setupSystemAuth}
            standard={false}
            type={BtnTypes.PRIMARY}
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
    alignSelf: 'center',
  },
  explanation: {
    paddingHorizontal: 10,
    marginVertical: 10,
    fontWeight: '300',
  },
  pincodeFooter: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    textAlign: 'center',
  },
  pincodeFooterText: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 35,
  },
  h1: {
    textAlign: 'center',
    padding: 25,
  },
  header: {
    paddingTop: 10,
    flexDirection: 'row',
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    mapDispatchToProps
  )(withNamespaces(Namespaces.nuxNamePin1)(SystemAuth))
)
