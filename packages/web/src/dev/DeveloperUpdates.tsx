import { memo } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import Title from 'src/dev/Title'
import { H3 } from 'src/fonts/Fonts'
import EmailForm, { DEVELOPER_LIST } from 'src/forms/EmailForm'
import { I18nProps, withNamespaces } from 'src/i18n'

import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { hashNav } from 'src/shared/menu-items'
import {
  DiscordChannel,
  EventsChannel,
  ForumChannel,
  GitHubChannel,
  TwitterChannel,
} from 'src/shared/SocialChannels'
import { fonts, standardStyles, textStyles } from 'src/styles'

const newsImg = require('src/dev/devNews.png')

export default withNamespaces('dev')(
  memo(function DeveloperUpdates({ t }: I18nProps) {
    return (
      <>
        <span id={'signup'} />
        <Title title={t('updates.title')} />
        <GridRow
          nativeID={hashNav.build.newsletter}
          desktopStyle={standardStyles.blockMarginBottom}
          tabletStyle={standardStyles.blockMarginBottomTablet}
          mobileStyle={standardStyles.blockMarginBottomMobile}
          allStyle={standardStyles.centered}
        >
          <Cell span={Spans.half}>
            <Fade>
              <View style={standardStyles.centered}>
                <Image resizeMode="contain" source={newsImg} style={styles.image} />
                <H3 style={[textStyles.center]}>{t('updates.devNews')}</H3>
                <Text style={[fonts.p, textStyles.center, standardStyles.elementalMarginBottom]}>
                  {t('updates.latestUpdates')}
                </Text>
              </View>
            </Fade>
            <Fade>
              <EmailForm
                submitText={t('updates.signUp')}
                listID={DEVELOPER_LIST}
                whenComplete={
                  <Fade>
                    <Text style={fonts.small}>{t('updates.signUpThanks')}</Text>
                  </Fade>
                }
              />
            </Fade>
          </Cell>
        </GridRow>
        <GridRow allStyle={standardStyles.centered}>
          <Cell span={Spans.three4th} style={[standardStyles.row, styles.channels]}>
            <TwitterChannel isDarkMode={false} />
            <GitHubChannel isDarkMode={false} />
            <DiscordChannel isDarkMode={false} />
            <ForumChannel isDarkMode={false} />
            <EventsChannel isDarkMode={false} />
          </Cell>
        </GridRow>
      </>
    )
  })
)

const styles = StyleSheet.create({
  channels: {
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-evenly',
  },
  image: {
    width: 45,
    height: 45,
  },
})
