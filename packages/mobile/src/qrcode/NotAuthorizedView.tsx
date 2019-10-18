import Button, { BtnTypes } from '@celo/react-components/components/Button'
import fontStyles from '@celo/react-components/styles/fonts'
import React, { useCallback } from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { Linking, Platform, StyleSheet, Text, View } from 'react-native'
import * as AndroidOpenSettings from 'react-native-android-open-settings'
import { Namespaces } from 'src/i18n'

type Props = WithNamespaces

function NotAuthorizedView({ t }: Props) {
  const onPressSettings = useCallback(async () => {
    if (Platform.OS === 'ios') {
      await Linking.openURL('app-settings:')
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

export default withNamespaces(Namespaces.sendFlow7)(NotAuthorizedView)
