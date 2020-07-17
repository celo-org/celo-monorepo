import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { Spacing } from '@celo/react-components/styles/styles.v2'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { Namespaces } from 'src/i18n'
import Logo, { LogoTypes } from 'src/icons/Logo.v2'
import { background } from 'src/images/Images'
import { nuxNavigationOptionsNoBackButton } from 'src/navigator/Headers.v2'
import { navigateHome } from 'src/navigator/NavigationService'

function OnboardingSuccessScreen() {
  useEffect(() => {
    const timeout = setTimeout(() => navigateHome(), 3000)

    return () => clearTimeout(timeout)
  }, [])

  const { t } = useTranslation(Namespaces.onboarding)

  return (
    <View style={styles.container}>
      <Image source={background} style={styles.backgroundImage} />
      <Logo type={LogoTypes.LIGHT} height={70} />
      <Text style={styles.text}>{t('success.message')}</Text>
    </View>
  )
}

OnboardingSuccessScreen.navigationOptions = nuxNavigationOptionsNoBackButton

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'stretch',
    width: undefined,
    height: undefined,
  },
  text: {
    ...fontStyles.h2,
    fontSize: 30,
    lineHeight: 36,
    color: colors.light,
    marginTop: Spacing.Regular16,
    marginBottom: 30,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    shadowOpacity: 1,
    shadowColor: 'rgba(46, 51, 56, 0.15)',
  },
})

export default OnboardingSuccessScreen
