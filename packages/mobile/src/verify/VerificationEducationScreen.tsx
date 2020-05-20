import Button, { BtnTypes } from '@celo/react-components/components/Button'
import Link from '@celo/react-components/components/Link'
import TextButton from '@celo/react-components/components/TextButton'
import VerifyPhone from '@celo/react-components/icons/VerifyPhone'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import Modal from 'react-native-modal'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import { Namespaces, withTranslation } from 'src/i18n'
import { setHasSeenVerificationNux } from 'src/identity/actions'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

interface DispatchProps {
  setHasSeenVerificationNux: typeof setHasSeenVerificationNux
}

type Props = WithTranslation & DispatchProps

interface State {
  isModalVisible: boolean
}

const mapDispatchToProps = {
  setHasSeenVerificationNux,
}

class VerificationEducationScreen extends React.Component<Props, State> {
  static navigationOptions = nuxNavigationOptions

  state: State = {
    isModalVisible: false,
  }

  onPressLearnMore = () => {
    navigate(Screens.VerificationLearnMoreScreen)
  }

  onPressStart = () => {
    this.props.setHasSeenVerificationNux(true)
    navigate(Screens.VerificationLoadingScreen)
  }

  onPressSkip = () => {
    this.setState({ isModalVisible: true })
  }

  onPressSkipCancel = () => {
    this.setState({ isModalVisible: false })
  }

  onPressSkipConfirm = () => {
    this.props.setHasSeenVerificationNux(true)
    navigateHome()
  }

  render() {
    const { t } = this.props
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <VerifyPhone />
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
            <Text style={styles.modalHeader}>{t('skipModal.header')}</Text>
            <Text style={fontStyles.body}>{t('skipModal.body1')}</Text>
            <Text style={[fontStyles.body, componentStyles.marginTop10]}>
              {t('skipModal.body2')}
            </Text>
            <View style={styles.modalButtonsContainer}>
              <TextButton
                onPress={this.onPressSkipCancel}
                style={styles.modalCancelText}
                testID="ModalCancel"
              >
                {t('global:cancel')}
              </TextButton>
              <TextButton
                onPress={this.onPressSkipConfirm}
                style={styles.modalSkipText}
                testID="ModalSkip"
              >
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
    marginHorizontal: 10,
    borderRadius: 4,
  },
  modalHeader: {
    ...fontStyles.h2,
    ...fontStyles.bold,
    marginVertical: 15,
  },
  modalButtonsContainer: {
    marginTop: 25,
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

export default connect<{}, DispatchProps>(
  null,
  mapDispatchToProps
)(withTranslation(Namespaces.nuxVerification2)(VerificationEducationScreen))
