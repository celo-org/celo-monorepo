import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button.v2'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { e164NumberSelector } from 'src/account/selectors'
import { approveAccountAuth } from 'src/dappkit/dappkit'
import { Namespaces, withTranslation } from 'src/i18n'
import { noHeader } from 'src/navigator/Headers.v2'
import { navigateBack, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton.v2'
import { StackParamList } from 'src/navigator/types'
import { RootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'dappkit/DappKitAccountScreen'

interface StateProps {
  account: string | null
  phoneNumber: string | null
}

interface DispatchProps {
  approveAccountAuth: typeof approveAccountAuth
}

type Props = StateProps &
  DispatchProps &
  WithTranslation &
  StackScreenProps<StackParamList, Screens.DappKitAccountAuth>

const mapStateToProps = (state: RootState): StateProps => ({
  account: currentAccountSelector(state),
  phoneNumber: e164NumberSelector(state),
})

const mapDispatchToProps = {
  approveAccountAuth,
}

class DappKitAccountAuthScreen extends React.Component<Props> {
  static navigationOptions = noHeader

  linkBack = () => {
    const { account, route, phoneNumber } = this.props

    const request = route.params.dappKitRequest

    if (!request) {
      Logger.error(TAG, 'No request found in navigation props')
      return
    }
    if (!account) {
      Logger.error(TAG, 'No account set up for this wallet')
      return
    }
    if (!phoneNumber) {
      Logger.error(TAG, 'No phone number set up for this wallet')
      return
    }
    navigateHome({ onAfterNavigate: () => this.props.approveAccountAuth(request) })
  }

  cancel = () => {
    navigateBack()
  }

  render() {
    const { t, account, route } = this.props
    const { dappName } = route.params.dappKitRequest
    return (
      <SafeAreaView style={styles.container}>
        <TopBarTextButton
          title={t('cancel')}
          onPress={this.cancel}
          titleStyle={styles.cancelButton}
        />

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {!!dappName && <Text style={styles.header}>{t('connectToWallet', { dappName })}</Text>}

          <Text style={styles.share}>{t('shareInfo')}</Text>

          <View style={styles.sectionDivider}>
            <Text style={styles.sectionHeaderText}>{t('address')}</Text>
            <Text style={styles.bodyText}>{account}</Text>
          </View>
          <Button
            style={styles.button}
            type={BtnTypes.PRIMARY}
            size={BtnSizes.MEDIUM}
            text={t('allow')}
            onPress={this.linkBack}
          />
        </ScrollView>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: '15%',
  },
  header: {
    ...fontStyles.h1,
    alignItems: 'center',
    paddingBottom: 16,
  },
  share: {
    ...fontStyles.regular,
    color: colors.gray4,
    textAlign: 'center',
  },
  sectionDivider: {
    alignItems: 'center',
    width: 200,
  },
  sectionHeaderText: {
    ...fontStyles.label,
    marginTop: 16,
  },
  bodyText: {
    ...fontStyles.regular,
    color: colors.gray4,
    textAlign: 'center',
  },
  button: {
    marginTop: 24,
  },
  cancelButton: {
    color: colors.dark,
  },
})

export default connect<StateProps, DispatchProps, {}, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation<Props>(Namespaces.dappkit)(DappKitAccountAuthScreen))
