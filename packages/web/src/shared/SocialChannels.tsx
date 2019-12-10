import { memo } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import Discord from 'src/icons/Discord'
import Discourse from 'src/icons/Discourse'
import LinkedIn from 'src/icons/LinkedIn'
import Octocat from 'src/icons/Octocat'
import { TweetLogo as TwitterLogo } from 'src/icons/TwitterLogo'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Button, { BTN } from 'src/shared/Button.3'
import menuItems, { CeloLinks } from 'src/shared/menu-items'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'
const eventsImg = require('src/dev/devEvents.png')

interface ChannelProps {
  icon: React.ReactNode
  title: string
  text: React.ReactNode
  link: string
}

interface ExternalChannelProps {
  isDarkMode: boolean
  alignCenter?: boolean
}

export const Channel = memo(function _Channel(props: ChannelProps & ExternalChannelProps) {
  const openExternalLinkInNewTab = props.link.includes('//') ? '_blank' : undefined
  return (
    <Fade bottom={true} distance="20px" delay={200}>
      <View
        style={[
          props.alignCenter && standardStyles.centered,
          props.alignCenter ? styles.channelContainer : styles.channelContainerLeft,
        ]}
      >
        <a href={props.link} target={openExternalLinkInNewTab}>
          <View style={[props.alignCenter && standardStyles.centered, styles.icon]}>
            {props.icon}
          </View>
          <Text
            style={[
              fonts.h6,
              props.alignCenter && textStyles.center,
              styles.channelTitle,
              props.isDarkMode && textStyles.invert,
            ]}
          >
            {props.title}
          </Text>
        </a>
        <Text
          style={[
            fonts.legal,
            props.alignCenter && textStyles.center,
            props.isDarkMode && textStyles.invert,
          ]}
        >
          {props.text}
        </Text>
      </View>
    </Fade>
  )
})

export function SocialLinks({ children }) {
  return (
    <GridRow allStyle={standardStyles.centered}>
      <Cell span={Spans.three4th} style={[standardStyles.row, styles.channels]}>
        {children}
      </Cell>
    </GridRow>
  )
}

export function TwitterChannel({ alignCenter, isDarkMode }: ExternalChannelProps) {
  return (
    <Channel
      isDarkMode={isDarkMode}
      alignCenter={alignCenter}
      title={'Twitter'}
      link={'//twitter.com/@celoDevs'}
      icon={<TwitterLogo height={40} color={isDarkMode ? colors.white : colors.dark} />}
      text={
        <>
          Follow{' '}
          <Button
            style={[fonts.legal, isDarkMode && textStyles.invert]}
            text={'@celoDevs'}
            kind={BTN.INLINE}
            href="https://twitter.com/@celoDevs"
          />{' '}
          &{' '}
          <Button
            style={[fonts.legal, isDarkMode && textStyles.invert]}
            text={'@celoHQ'}
            kind={BTN.INLINE}
            href="https://twitter.com/@celoHQ"
          />
        </>
      }
    />
  )
}

export const GitHubChannel = memo(function _GitHubChannel({
  alignCenter,
  isDarkMode,
}: ExternalChannelProps) {
  return (
    <Channel
      isDarkMode={isDarkMode}
      alignCenter={alignCenter}
      title={'GitHub'}
      link={CeloLinks.gitHub}
      icon={<Octocat size={41} color={isDarkMode ? colors.white : colors.dark} />}
      text={'Contribute to the codebase'}
    />
  )
})

export const DiscordChannel = memo(function _DiscordChannel({
  alignCenter,
  isDarkMode,
}: ExternalChannelProps) {
  return (
    <Channel
      isDarkMode={isDarkMode}
      alignCenter={alignCenter}
      title={'Discord'}
      link={CeloLinks.discord}
      icon={<Discord size={40} color={isDarkMode ? colors.white : colors.dark} />}
      text={'Collaborate and get\ndeveloper support'}
    />
  )
})

export const LinkedInChannel = memo(function _LinkedInChannel({
  isDarkMode,
  alignCenter,
}: ExternalChannelProps) {
  return (
    <Channel
      isDarkMode={isDarkMode}
      alignCenter={alignCenter}
      title={'LinkedIn'}
      link={CeloLinks.linkedIn}
      icon={<LinkedIn size={40} color={isDarkMode ? colors.white : colors.dark} />}
      text={'Find Professional Opportunities '}
    />
  )
})

export const ForumChannel = memo(function _ForumChannel({
  alignCenter,
  isDarkMode,
}: ExternalChannelProps) {
  return (
    <Channel
      isDarkMode={isDarkMode}
      alignCenter={alignCenter}
      title={'Forum'}
      link={CeloLinks.discourse}
      icon={<Discourse size={40} color={isDarkMode ? colors.white : colors.dark} />}
      text={'Ask technical questions'}
    />
  )
})

export const EventsChannel = memo(function _EventsChannel({
  alignCenter,
  isDarkMode,
}: ExternalChannelProps) {
  return (
    <Channel
      isDarkMode={isDarkMode}
      alignCenter={alignCenter}
      title={'Events'}
      link={menuItems.COMMUNITY.link}
      icon={<Image resizeMode="contain" source={eventsImg} style={styles.image} />}
      text={'Connect in Person'}
    />
  )
})

const styles = StyleSheet.create({
  channelContainer: {
    width: 180,
    margin: 40,
  },
  channelContainerLeft: {
    width: 180,
    marginBottom: 60,
    marginRight: 60,
  },
  channelTitle: {
    marginVertical: 15,
  },
  channels: {
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: 10,
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
})
