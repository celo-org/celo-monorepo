import { SettingsItemTextValue } from '@celo/react-components/components/SettingsItem'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FAQ_LINK, FORUM_LINK } from 'src/config'
import { Namespaces } from 'src/i18n'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { navigateToURI } from 'src/utils/linking'

const openExternalLink = (link: string) => () => navigateToURI(link)

const onPressContact = () => {
  navigate(Screens.SupportContact)
}

const Support = () => {
  const { t } = useTranslation(Namespaces.accountScreen10)
  return (
    <SafeAreaView style={styles.container}>
      <DrawerTopBar />
      <ScrollView>
        <Text style={styles.title} testID={'SettingsTitle'}>
          {t('global:help')}
        </Text>
        <View style={styles.containerList}>
          <SettingsItemTextValue
            testID="FAQLink"
            title={t('faq')}
            onPress={openExternalLink(FAQ_LINK)}
          />
          <SettingsItemTextValue
            testID="ForumLink"
            title={t('forum')}
            onPress={openExternalLink(FORUM_LINK)}
          />
          <SettingsItemTextValue
            testID="SupportContactLink"
            title={t('contact')}
            onPress={onPressContact}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  containerList: {
    flex: 1,
  },
  contactUs: {
    marginTop: 30,
    paddingLeft: 30,
  },
  title: {
    ...fontStyles.h1,
    margin: 16,
  },
})

export default Support
