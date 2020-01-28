import * as React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { H3 } from 'src/fonts/Fonts'
import EmailForm, { After } from 'src/forms/EmailForm'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import BookLayout from 'src/layout/BookLayout'
import { GridRow } from 'src/layout/GridRow'
import Button, { BTN } from 'src/shared/Button.3'
import {
  BrandChannel,
  DiscordChannel,
  EventsChannel,
  ForumChannel,
  GitHubChannel,
  TwitterChannel,
} from 'src/shared/SocialChannels'
import { colors, fonts, standardStyles } from 'src/styles'

interface Props {
  includeDividerLine: boolean
}

function ConnectionFooter({ t, includeDividerLine }: I18nProps & Props) {
  return (
    <>
      <GridRow
        desktopStyle={standardStyles.blockMargin}
        tabletStyle={standardStyles.blockMarginTablet}
        mobileStyle={standardStyles.blockMarginMobile}
      >
        {includeDividerLine && <View style={[styles.line]} />}
      </GridRow>
      <BookLayout label={t('conductLabel')}>
        <Text style={[fonts.p, standardStyles.elementalMarginBottom]}>{t('conductText')}</Text>
        <Button kind={BTN.PRIMARY} text={t('conductBtn')} />
      </BookLayout>
      <BookLayout label={t('experienceLabel')}>
        <View style={styles.engageArea}>
          <BrandChannel isDarkMode={false} />
        </View>
      </BookLayout>
      <BookLayout label={t('socialLabel')} isWide={true}>
        <View style={styles.engageArea}>
          <TwitterChannel isDarkMode={false} />
          <GitHubChannel isDarkMode={false} />
          <DiscordChannel isDarkMode={false} />
          <ForumChannel isDarkMode={false} />
          <EventsChannel isDarkMode={false} />
        </View>
        <View>
          <Image
            resizeMode="contain"
            source={{ uri: require('src/dev/devNews.png') }}
            style={styles.emailLogo}
          />
          <View style={styles.form}>
            <H3 style={styles.formTitle}>{t('stayConnected')}</H3>
            <Text style={[fonts.p, standardStyles.elementalMarginBottom]}>
              {t('receiveUpdates')}
            </Text>
            <EmailForm
              submitText={t('signUp')}
              route={'/contacts'}
              whenComplete={<After t={t} />}
              isDarkMode={false}
            />
          </View>
        </View>
      </BookLayout>
    </>
  )
}

const styles = StyleSheet.create({
  line: {
    height: 1,
    width: '100%',
    backgroundColor: colors.gray,
  },
  engageArea: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  form: {
    maxWidth: 475,
  },
  formTitle: {
    marginBottom: 10,
  },
  emailLogo: { width: 50, height: 50, marginVertical: 10 },
})

export default withNamespaces(NameSpaces.community)(ConnectionFooter)
