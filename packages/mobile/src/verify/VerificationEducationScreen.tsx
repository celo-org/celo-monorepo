import Button, { BtnTypes } from '@celo/react-components/components/Button'
import Link from '@celo/react-components/components/Link'
import TextButton from '@celo/react-components/components/TextButton'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import Modal from 'react-native-modal'
import SafeAreaView from 'react-native-safe-area-view'
import componentWithAnalytics from 'src/analytics/wrapper'
import { Namespaces } from 'src/i18n'
import NuxLogo from 'src/icons/NuxLogo'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

interface State {
  isModalVisible: boolean
}

class VerificationEducationScreen extends React.Component<WithNamespaces, State> {
  static navigationOptions = nuxNavigationOptions

  state: State = {
    isModalVisible: false,
  }

  onPressLearnMore = () => {
    navigate(Screens.VerificationLearnMoreScreen)
  }

  onPressStart = () => {
    // TODO(Rossy) Use new verification screen when it's ready
    navigate(Screens.VerificationLoadingScreen)
  }

  onPressSkip = () => {
    this.setState({ isModalVisible: true })
  }

  onPressSkipCancel = () => {
    this.setState({ isModalVisible: false })
  }

  onPressSkipConfirm = () => {
    // TODO(Rossy) mark verificaiton as skipped so app doesn't come back to this screen
    // navigateReset?
    navigate(Screens.WalletHome)
  }

  render() {
    const { t } = this.props
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/** TODO use new icon when it's ready */}
          <NuxLogo testID="VerificationEducationIcon" />
          <Text style={styles.h1} testID="VerificationEducationHeader">
            {t('education.header')}
          </Text>
          <Text style={styles.body}>{t('education.body1')}</Text>
          <Text style={styles.body}>{t('education.body2')}</Text>
          <Link onPress={this.onPressLearnMore}>{t('education.learnMore')}</Link>
        </ScrollView>
        <>
          <Button
            text={t('education.start')}
            onPress={this.onPressStart}
            standard={false}
            type={BtnTypes.PRIMARY}
            testID="VerificationEducationContinue"
          />
          <Button
            text={t('education.skip')}
            onPress={this.onPressSkip}
            standard={false}
            type={BtnTypes.SECONDARY}
            testID="VerificationEducationSkip"
          />
        </>
        <Modal isVisible={this.state.isModalVisible}>
          <View style={styles.modalContainer}>
            <Text style={fontStyles.h1}>{t('skipModal.header')}</Text>
            <Text style={fontStyles.body}>{t('skipModal.body1')}</Text>
            <Text style={[fontStyles.body, componentStyles.marginTop10]}>
              {t('skipModal.body2')}
            </Text>
            <View style={styles.modalButtonsContainer}>
              <TextButton onPress={this.onPressSkipCancel} style={styles.modalCancelText}>
                {t('global:cancel')}
              </TextButton>
              <TextButton onPress={this.onPressSkipConfirm} style={styles.modalSkipText}>
                {t('global:skip')}
              </TextButton>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flex: 1,
    padding: 30,
    paddingTop: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  h1: {
    ...fontStyles.h1,
    marginTop: 20,
  },
  body: {
    ...fontStyles.bodyLarge,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalContainer: {
    backgroundColor: colors.background,
    padding: 20,
    borderRadius: 4,
  },
  modalButtonsContainer: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  modalCancelText: {
    ...fontStyles.body,
    ...fontStyles.semiBold,
    paddingRight: 20,
  },
  modalSkipText: {
    ...fontStyles.body,
    ...fontStyles.semiBold,
    color: colors.celoGreen,
    paddingLeft: 20,
  },
})

export default componentWithAnalytics(
  withNamespaces(Namespaces.nuxVerification2)(VerificationEducationScreen)
)
