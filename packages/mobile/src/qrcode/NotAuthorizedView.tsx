import Button, { BtnTypes } from '@celo/react-components/components/Button'
import fontStyles from '@celo/react-components/styles/fonts'
import React, { useCallback } from 'react'
import { WithTranslation } from 'react-i18next'
import { Platform, StyleSheet, Text, View } from 'react-native'
import * as AndroidOpenSettings from 'react-native-android-open-settings'
import { Namespaces, withTranslation } from 'src/i18n'
import { navigateToURI } from 'src/utils/linking'

type Props = WithTranslation

function NotAuthorizedView({ t }: Props) {
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
      <Button
        onPress={onPressSettings}
        text={t('cameraSettings')}
        standard={false}
        type={BtnTypes.SECONDARY}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  title: {
    ...fontStyles.h2,
    ...fontStyles.bold,
  },
  description: {
    marginTop: 10,
    ...fontStyles.body,
    textAlign: 'center',
  },
})

export default withTranslation(Namespaces.sendFlow7)(NotAuthorizedView)
