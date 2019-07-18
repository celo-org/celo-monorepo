import { memo } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import Title from 'src/dev/Title'
import { H3 } from 'src/fonts/Fonts'
import EmailForm, { DEVELOPER_LIST } from 'src/forms/EmailForm'
import { I18nProps, withNamespaces } from 'src/i18n'
import Discord from 'src/icons/Discord'
import Octocat from 'src/icons/Octocat'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Button, { BTN } from 'src/shared/Button.3'
import menuItems, { CeloLinks } from 'src/shared/menu-items'
import { TweetLogo as TwitterLogo } from 'src/shared/TwitterLogo'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'

const newsImg = require('src/dev/devNews.png')
const eventsImg = require('src/dev/devEvents.png')
const discourseImg = require('src/dev/discourse.png')

export default withNamespaces('dev')(
  memo(function DeveloperUpdates({ t }: I18nProps) {
    return (
      <>
        <Title title={t('updates.title')} />
        <GridRow
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
            <Channel
              title={'Twitter'}
              link={'//twitter.com/@celoDevs'}
              icon={<TwitterLogo height={36} color={colors.dark} />}
              text={
                <>
                  Follow{' '}
                  <Button
                    style={fonts.legal}
                    text={'@celoDevs'}
                    kind={BTN.INLINE}
                    href="https://twitter.com/@celoDevs"
                  />{' '}
                  &{' '}
                  <Button
                    style={fonts.legal}
                    text={'@celoHQ'}
                    kind={BTN.INLINE}
                    href="https://twitter.com/@celoHQ"
                  />
                </>
              }
            />
            <Channel
              title={'GitHub'}
              link={CeloLinks.gitHub}
              icon={<Octocat size={36} color={colors.dark} />}
              text={'Contribute to the codebase'}
            />
            <Channel
              title={'Discord'}
              link={CeloLinks.discord}
              icon={<Discord size={36} color={colors.dark} />}
              text={'Collaborate and get developer support'}
            />
            <Channel
              title={'Forum'}
              link={CeloLinks.discourse}
              icon={<Image resizeMode="contain" source={discourseImg} style={styles.discourse} />}
              text={'Ask technical questions'}
            />
            <Channel
              title={'Events'}
              link={menuItems.COMMUNITY.link}
              icon={<Image resizeMode="contain" source={eventsImg} style={styles.image} />}
              text={'Connect in Person'}
            />
          </Cell>
        </GridRow>
      </>
    )
  })
)

interface ChannelProps {
  icon: React.ReactNode
  title: string
  text: React.ReactNode
  link: string
}

function Channel(props: ChannelProps) {
  const openExternalLinkInNewTab = props.link.includes('//') ? '_new' : undefined
  return (
    <Fade bottom={true} distance="20px" delay={200}>
      <View style={[standardStyles.centered, styles.channelContainer]}>
        <a href={props.link} target={openExternalLinkInNewTab}>
          <View style={[standardStyles.centered, styles.icon]}>{props.icon}</View>
          <Text style={[fonts.h5, textStyles.center, styles.channelTitle]}>{props.title}</Text>
        </a>
        <Text style={[fonts.legal, textStyles.center]}>{props.text}</Text>
      </View>
    </Fade>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: 'flex-start', justifyContent: 'center' },
  channelContainer: {
    maxWidth: 190,
    margin: 40,
  },
  channelTitle: {
    marginVertical: 15,
  },
  channels: {
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-evenly',
  },
  image: {
    height: 45,
    width: 45,
  },
  discourse: {
    height: 35,
    width: 35,
    marginBottom: 10,
  },
  icon: {
    marginBottom: 10,
  },
})
