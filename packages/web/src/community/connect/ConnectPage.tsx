import * as React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import CodeOfConduct from 'src/community/connect/CodeOfConduct'
import Contribute from 'src/community/connect/Contribute'
import CoverArea from 'src/community/connect/CoverArea'
import FellowSection from 'src/community/connect/FellowSection'
import Tenets from 'src/community/connect/Tenets'
import EcoFund from 'src/community/EcoFund'
import { H2, H3 } from 'src/fonts/Fonts'
import EmailForm, { After } from 'src/forms/EmailForm'
import OpenGraph from 'src/header/OpenGraph'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { hashNav } from 'src/shared/menu-items'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'
import ArticleData from './ArticleData'
import EventData from './EventsData'

import {
  DiscordChannel,
  ForumChannel,
  GitHubChannel,
  LinkedInChannel,
  SocialLinks,
  TwitterChannel,
} from 'src/shared/SocialChannels'

const preview = require('src/community/connect/preview.jpg')

type Props = I18nProps

// only send used translations to the client
const NAME_SPACES = ['common', 'community']

export class ConnectPage extends React.Component<Props> {
  // This is Next.js method that runs serverside. it is only available on page components
  static getInitialProps = () => {
    return {
      namespacesRequired: NAME_SPACES,
    }
  }

  render() {
    const { t } = this.props
    return (
      <>
        <OpenGraph
          path="/community"
          title={t('pageTitle')}
          description={
            'Celo is building a monetary system that allows more people to participate, and we invite you to join the conversation and our community. Diverse perspectives and inclusive conversations welcomed.'
          }
          image={preview}
        />
        <View>
          <CoverArea />
          <Tenets />

          <CodeOfConduct />
          <GridRow
            nativeID={hashNav.connect.events}
            desktopStyle={standardStyles.sectionMarginTop}
            mobileStyle={standardStyles.sectionMarginTopMobile}
          >
            <Cell span={Spans.full} style={standardStyles.centered}>
              <Fade bottom={true} distance={'20px'}>
                <H2>{t('events.title')}</H2>
              </Fade>
            </Cell>
          </GridRow>
          <EventData />
          <ArticleData />
          <Contribute />
          <EcoFund />
          <FellowSection />
          <View style={styles.darkBackground} nativeID={hashNav.connect.newsletter}>
            <GridRow
              desktopStyle={standardStyles.sectionMarginTop}
              tabletStyle={standardStyles.sectionMarginTopTablet}
              mobileStyle={standardStyles.blockMarginTopMobile}
            >
              <Cell span={Spans.full} style={standardStyles.centered}>
                <Image
                  source={{ uri: require('src/shared/Developer-news.png') }}
                  style={styles.emailLogo}
                />
                <View style={styles.form}>
                  <H3 style={[textStyles.invert, textStyles.center]}>{t('stayConnected')}</H3>
                  <Text
                    style={[
                      fonts.p,
                      textStyles.invert,
                      textStyles.center,
                      standardStyles.elementalMarginBottom,
                    ]}
                  >
                    {t('receiveUpdates')}
                  </Text>
                  <EmailForm
                    submitText={t('signUp')}
                    route={'/contacts'}
                    whenComplete={<After t={this.props.t} />}
                    isDarkMode={true}
                  />
                </View>
              </Cell>
            </GridRow>
            <SocialLinks>
              <TwitterChannel isDarkMode={true} />
              <GitHubChannel isDarkMode={true} />
              <DiscordChannel isDarkMode={true} />
              <ForumChannel isDarkMode={true} />
              <LinkedInChannel isDarkMode={true} />
            </SocialLinks>
          </View>
        </View>
      </>
    )
  }
}

const styles = StyleSheet.create({
  darkBackground: {
    backgroundColor: colors.dark,
  },
  form: {
    maxWidth: 372,
    paddingBottom: 30,
  },
  emailLogo: {
    height: 45,
    width: 45,
    marginBottom: 10,
  },
})

export default withNamespaces(NameSpaces.community)(ConnectPage)
