import * as React from 'react'
import { View } from 'react-native'
import Fade from 'react-reveal/Fade'
import ArticleData from 'src/community/connect/ArticleData'
import CodeOfConduct from 'src/community/connect/CodeOfConduct'
import Contribute from 'src/community/connect/Contribute'
import CoverArea from 'src/community/connect/CoverArea'
import EventData from 'src/community/connect/EventsData'
import FellowSection from 'src/community/connect/FellowSection'
import preview from 'src/community/connect/preview.jpg'
import Tenets from 'src/community/connect/Tenets'
import EcoFund from 'src/community/EcoFund'
import { H2 } from 'src/fonts/Fonts'
import OpenGraph from 'src/header/OpenGraph'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { hashNav } from 'src/shared/menu-items'
import { standardStyles } from 'src/styles'

type Props = I18nProps

// only send used translations to the client
const NAME_SPACES = ['common', 'community']

export class CommunityPage extends React.Component<Props> {
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
          <ArticleData title={t('articles.title')} />
          <Contribute />
          <EcoFund />
          <FellowSection />
          <View nativeID={hashNav.connect.newsletter} />
        </View>
      </>
    )
  }
}

export default withNamespaces(NameSpaces.community)(CommunityPage)
