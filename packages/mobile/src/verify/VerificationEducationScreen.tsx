import Button, { BtnTypes } from '@celo/react-components/components/Button.v2'
import TextButton from '@celo/react-components/components/TextButton.v2'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { Spacing } from '@celo/react-components/styles/styles.v2'
import { StackScreenProps, useHeaderHeight } from '@react-navigation/stack'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeArea } from 'react-native-safe-area-view'
import { useDispatch } from 'react-redux'
import { ErrorMessages } from 'src/app/ErrorMessages'
import ErrorMessageInline from 'src/components/ErrorMessageInline'
import i18n, { Namespaces } from 'src/i18n'
import { setHasSeenVerificationNux } from 'src/identity/actions'
import { isUserBalanceSufficient } from 'src/identity/utils'
import { INVITE_FEE } from 'src/invite/saga'
import { HeaderTitleWithSubtitle, nuxNavigationOptions } from 'src/navigator/Headers.v2'
import { navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton.v2'
import { StackParamList } from 'src/navigator/types'
import useSelector from 'src/redux/useSelector'
import VerificationLearnMoreDialog from 'src/verify/VerificationLearnMoreDialog'
import VerificationSkipDialog from 'src/verify/VerificationSkipDialog'

const VERIFICATION_FEE_ESTIMATE = Number(INVITE_FEE) * 0.9

type ScreenProps = StackScreenProps<StackParamList, Screens.VerificationEducationScreen>

type Props = ScreenProps

function VerificationEducationScreen({ route, navigation }: Props) {
  const showSkipDialog = route.params?.showSkipDialog || false
  const [showLearnMoreDialog, setShowLearnMoreDialog] = useState(false)
  const [hasPressedStart, setHasPressedStart] = useState(false)
  const { t } = useTranslation(Namespaces.onboarding)
  const userBalance = useSelector((state) => state.stableToken.balance)
  const balanceIsSufficient = isUserBalanceSufficient(userBalance, VERIFICATION_FEE_ESTIMATE)
  // For now only show error if user has pressed start
  // with the idea being that by the time the user is done reading the screen the balance will already be known
  const showError = hasPressedStart && !balanceIsSufficient
  const dispatch = useDispatch()
  const headerHeight = useHeaderHeight()
  const insets = useSafeArea()

  const onPressStart = () => {
    setHasPressedStart(true)
    if (!balanceIsSufficient) {
      return
    }
    dispatch(setHasSeenVerificationNux(true))
    navigation.navigate(Screens.VerificationLoadingScreen)
  }

  const onPressSkipCancel = () => {
    navigation.setParams({ showSkipDialog: false })
  }

  const onPressSkipConfirm = () => {
    dispatch(setHasSeenVerificationNux(true))
    navigateHome()
  }

  const onPressLearnMore = () => {
    setShowLearnMoreDialog(true)
  }

  const onPressLearnMoreDismiss = () => {
    setShowLearnMoreDialog(false)
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={headerHeight ? { marginTop: headerHeight } : undefined}
        contentContainerStyle={[styles.scrollContainer, insets && { marginBottom: insets.bottom }]}
      >
        <Text style={styles.header} testID="VerificationEducationHeader">
          {t('verificationEducation.header')}
        </Text>
        <Text style={styles.body}>{t('verificationEducation.body')}</Text>
        <Button
          text={t('verificationEducation.start')}
          disabled={showError}
          onPress={onPressStart}
          type={BtnTypes.ONBOARDING}
          style={styles.startButton}
          testID="VerificationEducationContinue"
        />
        {showError && (
          <ErrorMessageInline
            error={balanceIsSufficient ? null : ErrorMessages.INSUFFICIENT_BALANCE}
          />
        )}
        <View style={styles.spacer} />
        <TextButton style={styles.learnMoreButton} onPress={onPressLearnMore}>
          {t('verificationEducation.learnMore')}
        </TextButton>
      </ScrollView>
      <VerificationSkipDialog
        isVisible={showSkipDialog}
        onPressCancel={onPressSkipCancel}
        onPressConfirm={onPressSkipConfirm}
      />
      <VerificationLearnMoreDialog
        isVisible={showLearnMoreDialog}
        onPressDismiss={onPressLearnMoreDismiss}
      />
    </View>
  )
}

VerificationEducationScreen.navigationOptions = ({ navigation }: ScreenProps) => ({
  ...nuxNavigationOptions,
  headerTitle: () => (
    <HeaderTitleWithSubtitle
      title={i18n.t('onboarding:verificationEducation.title')}
      subTitle={i18n.t('onboarding:step', { step: '4' })}
    />
  ),
  headerRight: () => (
    <TopBarTextButton
      title={i18n.t('global:skip')}
      testID="VerificationEducationSkip"
      // tslint:disable-next-line: jsx-no-lambda
      onPress={() => navigation.setParams({ showSkipDialog: true })}
      titleStyle={{ color: colors.goldDark }}
    />
  ),
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.onboardingBackground,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  header: {
    ...fontStyles.h2,
    marginBottom: Spacing.Regular16,
  },
  body: {
    ...fontStyles.regular,
    marginBottom: Spacing.Thick24,
  },
  startButton: {
    marginBottom: Spacing.Thick24,
  },
  spacer: {
    flex: 1,
  },
  learnMoreButton: {
    textAlign: 'center',
    color: colors.onboardingBrownLight,
    padding: Spacing.Regular16,
  },
})

export default VerificationEducationScreen
