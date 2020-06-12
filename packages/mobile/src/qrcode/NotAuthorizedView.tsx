import TextButton from '@celo/react-components/components/TextButton.v2'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, StyleSheet, Text, View } from 'react-native'
import * as AndroidOpenSettings from 'react-native-android-open-settings'
import { Namespaces } from 'src/i18n'
import { navigateToURI } from 'src/utils/linking'

export default function NotAuthorizedView() {
  const { t } = useTranslation(Namespaces.sendFlow7)
  const onPressSettings = useCallback(() => {
    if (Platform.OS === 'ios') {
      navigateToURI('app-settings:')
    } else if (Platform.OS === 'android') {
      AndroidOpenSettings.appDetailsSettings()
    }
  }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('cameraNotAuthorizedTitle')}</Text>
      <Text style={styles.description}>{t('cameraNotAuthorizedDescription')}</Text>
      <TextButton onPress={onPressSettings}>{t('cameraSettings')}</TextButton>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  title: {
    ...fontStyles.h2,
    marginBottom: 8,
    color: colors.white,
  },
  description: {
    ...fontStyles.regular,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 16,
  },
})
