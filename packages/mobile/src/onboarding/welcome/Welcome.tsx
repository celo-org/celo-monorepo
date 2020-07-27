import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button.v2'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { Spacing } from '@celo/react-components/styles/styles.v2'
import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import Logo, { LogoTypes } from 'src/icons/Logo.v2'
import { welcomeBgContent, welcomeBgHeader } from 'src/images/Images'
import { nuxNavigationOptions } from 'src/navigator/Headers.v2'
import LanguageButton from 'src/onboarding/LanguageButton'

interface Props {}

export default function Welcome(props: Props) {
  const onPressCreateAccount = () => {}

  const onPressRestoreAccount = () => {}

  const insets = useSafeAreaInsets()

  return (
    <SafeAreaView style={styles.container}>
      <SafeAreaView style={styles.headerBgImage} edges={['top']}>
        <Image source={welcomeBgHeader} />
      </SafeAreaView>
      <Image source={welcomeBgContent} style={styles.contentBgImage} />
      <View style={styles.titleContainer}>
        <Logo type={LogoTypes.COLOR} height={64} />
        <Text style={styles.title}>Your value,{'\n'}on your phone</Text>
      </View>
      <View style={[styles.buttonsContainer, { marginBottom: Math.max(0, 40 - insets.bottom) }]}>
        <Button
          onPress={onPressCreateAccount}
          text={'Create new account'}
          size={BtnSizes.FULL}
          type={BtnTypes.ONBOARDING}
          style={styles.createAccountButton}
        />
        <Button
          onPress={onPressRestoreAccount}
          text={'I have an account'}
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
  headerBgImage: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  contentBgImage: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  titleContainer: {
    top: '23%',
  },
  title: {
    ...fontStyles.h1,
    fontSize: 30,
    lineHeight: 36,
    marginTop: Spacing.Smallest8,
  },
  buttonsContainer: {
    marginTop: 'auto',
  },
  createAccountButton: {
    marginBottom: Spacing.Smallest8,
  },
})
