import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { H1 } from 'src/fonts/Fonts'
import OpenGraph from 'src/header/OpenGraph'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import SideTitledSection from 'src/layout/SideTitledSection'
import { HEADER_HEIGHT } from 'src/shared/Styles'
import { fonts, standardStyles, textStyles } from 'src/styles'
import { HelpfullLink } from './HelpfullLink'

class Papers extends React.PureComponent<I18nProps> {
  static getInitialProps() {
    return { namespacesRequired: [NameSpaces.papers, NameSpaces.common] }
  }
  render() {
    const { t } = this.props
    return (
      <>
        <OpenGraph title={t('title')} path={NameSpaces.papers} description={t('metaDescription')} />
        <View style={styles.container}>
          <GridRow
            allStyle={standardStyles.centered}
            desktopStyle={standardStyles.blockMarginBottom}
            tabletStyle={standardStyles.blockMarginBottomTablet}
            mobileStyle={standardStyles.blockMarginBottomMobile}
          >
            <Cell span={Spans.three4th} style={standardStyles.centered}>
              <H1 style={textStyles.center}>{t('title')}</H1>
            </Cell>
          </GridRow>
          <SideTitledSection span={Spans.three4th} title={t('protocol')}>
            <Text style={fonts.p}>{t('whitepaperTitle')}</Text>
            <View style={styles.links}>
              <HelpfullLink text={t('download')} href={'/papers/whitepaper'} />
              <HelpfullLink text={'阅读'} href={'/papers/celo-wp-simplified-chinese.pdf'} />
            </View>
          </SideTitledSection>
          <SideTitledSection span={Spans.three4th} title={t('economics')}>
            <Text style={fonts.p}>{t('stabilityTitle')}</Text>
            <HelpfullLink text={t('download')} href={'/papers/stability'} />
          </SideTitledSection>
          <SideTitledSection span={Spans.three4th} title={''}>
            <Text style={fonts.p}>{t('velocityTitle')}</Text>
            <HelpfullLink text={t('download')} href={'/papers/cbdc-velocity'} />
          </SideTitledSection>
        </View>
      </>
    )
  }
}

export default withNamespaces(NameSpaces.papers)(Papers)

const styles = StyleSheet.create({
  container: {
    marginTop: HEADER_HEIGHT,
    paddingTop: HEADER_HEIGHT,
  },
  links: {
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
  link: {
    marginRight: 30,
  },
})
