import { StyleSheet, Text, View } from 'react-native'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import BookLayout from 'src/layout/BookLayout'
import Button, { BTN } from 'src/shared/Button.3'
import {
  DiscordChannel,
  EventsChannel,
  ForumChannel,
  GitHubChannel,
  TwitterChannel,
} from 'src/shared/SocialChannels'
import { fonts } from 'src/styles'

function ConnectionFooter({ t }: I18nProps) {
  return (
    <>
      <BookLayout label={t('conductLabel')}>
        <Text style={fonts.p}>{t('conductText')}</Text>
        <Button kind={BTN.PRIMARY} text={t('conductBtn')} />
      </BookLayout>
      <BookLayout label={t('socialLabel')} isWide={true}>
        <View style={styles.engageArea}>
          <TwitterChannel isDarkMode={false} />
          <GitHubChannel isDarkMode={false} />
          <DiscordChannel isDarkMode={false} />
          <ForumChannel isDarkMode={false} />
          <EventsChannel isDarkMode={false} />
        </View>
      </BookLayout>
    </>
  )
}

const styles = StyleSheet.create({
  engageArea: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
})

export default withNamespaces(NameSpaces.community)(ConnectionFooter)
