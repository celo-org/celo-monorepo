import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button.v2'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { Spacing } from '@celo/react-components/styles/styles.v2'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { chooseRestoreAccount } from 'src/account/actions'
import { Namespaces } from 'src/i18n'
import Logo, { LogoTypes } from 'src/icons/Logo.v2'
import { welcomeBackground } from 'src/images/Images'
import { nuxNavigationOptions } from 'src/navigator/Headers.v2'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import LanguageButton from 'src/onboarding/LanguageButton'

export default function Welcome() {
  const { t } = useTranslation(Namespaces.onboarding)
  const dispatch = useDispatch()
  const insets = useSafeAreaInsets()

  const navigateNext = () => {
    navigate(Screens.RegulatoryTerms)
  }

  const onPressCreateAccount = () => {
    navigateNext()
  }

  const onPressRestoreAccount = () => {
    dispatch(chooseRestoreAccount())
    navigateNext()
  }

  return (
    <SafeAreaView style={styles.container}>
      <Image source={welcomeBackground} style={styles.backgroundImage} />
      <View style={styles.titleContainer}>
        <Logo type={LogoTypes.COLOR} height={64} />
        <Text style={styles.title}>{t('welcome.title')}</Text>
      </View>
      <View style={{ marginBottom: Math.max(0, 40 - insets.bottom) }}>
        <Button
          onPress={onPressCreateAccount}
          text={t('welcome.createAccount')}
          size={BtnSizes.FULL}
          type={BtnTypes.ONBOARDING}
          style={styles.createAccountButton}
        />
        <Button
          onPress={onPressRestoreAccount}
          text={t('welcome.restoreAccount')}
          size={BtnSizes.FULL}
          type={BtnTypes.ONBOARDING_SECONDARY}
        />
      </View>
    </SafeAreaView>
  )
}

Welcome.navigationOptions = {
  ...nuxNavigationOptions,
  headerRight: () => <LanguageButton />,
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.onboardingBackground,
    paddingHorizontal: Spacing.Thick24,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...fontStyles.h1,
    fontSize: 30,
    lineHeight: 36,
    marginTop: Spacing.Smallest8,
  },
  createAccountButton: {
    marginBottom: Spacing.Smallest8,
  },
})
