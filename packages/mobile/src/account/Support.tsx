import Link from '@celo/react-components/components/Link'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import SettingsItem from 'src/account/SettingsItem'
import { FAQ_LINK, FORUM_LINK } from 'src/config'
import i18n, { Namespaces } from 'src/i18n'
import { headerWithBackButton } from 'src/navigator/Headers'
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
      <View style={styles.containerList}>
        <SettingsItem
          testID="WebFAQLink"
          title={t('webFaq')}
          onPress={openExternalLink(FAQ_LINK)}
        />
        <SettingsItem
          testID="ForumLink"
          title={t('forum')}
          onPress={openExternalLink(FORUM_LINK)}
        />
      </View>
      <View style={styles.contactUs}>
        <Text style={fontStyles.body}>{t('contactText')} </Text>
        <Link onPress={onPressContact} testID="SupportContactLink" style={styles.contactLink}>
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
    paddingLeft: 30,
  },
  contactLink: {
    ...fontStyles.body,
  },
})

export default Support
