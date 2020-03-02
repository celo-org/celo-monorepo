import Link from '@celo/react-components/components/Link'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, StyleSheet, Text, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import SettingsItem from 'src/account/SettingsItem'
import i18n, { Namespaces } from 'src/i18n'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Logger from 'src/utils/Logger'

const openExternalLink = (link: string) => {
  return async () => {
    try {
      await Linking.openURL(link)
    } catch (e) {
      Logger.error('Support/openExternalLink', '', e)
    }
  }
}

const onPressContact = () => {
  navigate(Screens.Contact)
}

const Support = () => {
  const { t } = useTranslation(Namespaces.accountScreen10)
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.containerList}>
        <SettingsItem title={t('webFaq')} onPress={openExternalLink('https://celo.org/faq')} />
        <SettingsItem
          title={t('forum')}
          onPress={openExternalLink('https://forum.celo.org/c/support')}
        />
      </View>
      <View style={styles.contactUs}>
        <Text style={fontStyles.body}>{t('contactText')}</Text>
        <Link onPress={onPressContact} style={styles.contactLink}>
          {t('contactUs')}
        </Link>
      </View>
    </SafeAreaView>
  )
}

Support.navigationOptions = () => ({
  ...headerWithBackButton,
  headerTitle: i18n.t('accountScreen10:support'),
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  containerList: {
    paddingLeft: 20,
    borderTopWidth: 1,
    borderColor: '#EEEEEE',
  },
  contactUs: {
    marginTop: 30,
    alignItems: 'center',
  },
  contactLink: {
    ...fontStyles.bodyBold,
    color: colors.celoGreen,
    textDecorationLine: 'none',
  },
})

export default Support
