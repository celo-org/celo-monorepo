import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import ProgressBar from 'react-native-progress/Bar'
import { connect } from 'react-redux'
import componentWithAnalytics from 'src/analytics/wrapper'
import DevSkipButton from 'src/components/DevSkipButton'
import { Namespaces } from 'src/i18n'
import NuxLogo from 'src/icons/NuxLogo'
import { navigateReset } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'
import { checkSyncProgress } from 'src/web3/actions'
const sendReceive = require('src/images/send-receive.png')
const stabilityScale = require('src/images/stability-scale.png')
const verifyPhone = require('src/images/verify-phone.png')

interface StateProps {
  isWeb3Ready: boolean
  syncProgress: number
  pincodeSet: boolean
}

interface DispatchProps {
  checkSyncProgress: typeof checkSyncProgress
}

type Props = StateProps & DispatchProps & WithNamespaces

const mapStateToProps = (state: RootState): StateProps => {
  return {
    isWeb3Ready: state.web3.isReady,
    syncProgress: state.web3.syncProgress > 0 ? state.web3.syncProgress : 0,
    pincodeSet: state.account.pincodeSet,
  }
}

export class Sync extends React.Component<Props> {
  static navigationOptions = {
    header: null,
  }

  componentDidMount() {
    this.props.checkSyncProgress()
  }

  componentDidUpdate() {
    if (this.props.isWeb3Ready) {
      this.continue()
    }
  }

  continue = () => {
    const nextScreen: string = this.props.pincodeSet ? Screens.EnterInviteCode : Screens.Pincode
    Logger.debug(
      'Sync@continue',
      `Pincode set: ${this.props.pincodeSet} next Screen: ${nextScreen}`
    )
    navigateReset(nextScreen)
  }

  render() {
    const { t } = this.props
    return (
      <View style={styles.container}>
        <DevSkipButton nextScreen={Screens.Pincode} />
        <ScrollView>
          <NuxLogo />
          <View style={styles.infoContainer}>
            <Image resizeMode="contain" style={styles.image} source={sendReceive} />
            <View style={styles.text}>
              <Text style={fontStyles.body}>{t('secureAsset')}</Text>
            </View>
          </View>
          <View style={styles.infoContainer}>
            <Image resizeMode="contain" style={styles.image} source={stabilityScale} />
            <View style={styles.text}>
              <Text style={fontStyles.body}>{t('stableAsset')}</Text>
            </View>
          </View>
          <View style={styles.infoContainer}>
            <Image resizeMode="contain" style={styles.image} source={verifyPhone} />
            <View style={styles.text}>
              <Text style={fontStyles.body}>{t('verifyNumber')}</Text>
            </View>
          </View>
        </ScrollView>
        <View style={{ alignItems: 'center' }}>
          <ProgressBar
            width={variables.width - 20 * 2}
            height={2}
            progress={this.props.syncProgress / 100}
            color={colors.celoGreen}
            unfilledColor={colors.inactive}
            borderColor={'transparent'}
          />
          <Text style={[fontStyles.bodySmall, styles.bottomText]}>
            {t('syncNetwork')} ({Math.round(this.props.syncProgress)}%)
          </Text>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'white',
    justifyContent: 'space-between',
    paddingTop: 30,
    paddingHorizontal: 10,
    paddingBottom: 15,
  },
  infoContainer: {
    paddingBottom: 50,
    paddingHorizontal: 40,
    flexDirection: 'row',
  },
  image: {
    height: 65,
    width: 70,
    marginRight: 25,
  },
  text: {
    flex: 1,
  },
  bottomText: {
    paddingVertical: 10,
    color: colors.dark,
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    { checkSyncProgress }
  )(withNamespaces(Namespaces.nuxNamePin1)(Sync))
)
