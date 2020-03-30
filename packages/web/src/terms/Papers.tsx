import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { H1 } from 'src/fonts/Fonts'
import OpenGraph from 'src/header/OpenGraph'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import SideTitledSection from 'src/layout/SideTitledSection'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import { HEADER_HEIGHT } from 'src/shared/Styles'
import { fonts, standardStyles, textStyles } from 'src/styles'

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
          <SideTitledSection title={t('protocol')}>
            <Text style={[fonts.p, standardStyles.elementalMarginBottom]}>
              {t('whitepaperTitle')}
            </Text>
            <HelpfullLink text={t('download')} href={'/papers/whitepaper'} />
          </SideTitledSection>
          <SideTitledSection title={t('economics')}>
            <Text style={[fonts.p, standardStyles.elementalMarginBottom]}>
              {t('stabilityTitle')}
            </Text>
            <HelpfullLink text={t('download')} href={'/papers/stability'} />
          </SideTitledSection>
          <SideTitledSection title={''}>
            <Text style={[fonts.p, standardStyles.elementalMarginBottom]}>
              {t('velocityTitle')}
            </Text>
            <HelpfullLink text={t('download')} href={'/papers/cbdc-velocity'} />
          </SideTitledSection>
        </View>
      </>
    )
  }
}

function HelpfullLink({ text, href }) {
  return <Button kind={BTN.NAKED} text={text} href={href} size={SIZE.normal} target="_blank" />
}

export default withNamespaces(NameSpaces.papers)(Papers)

const styles = StyleSheet.create({
  container: {
    marginTop: HEADER_HEIGHT,
    paddingTop: HEADER_HEIGHT,
  },
  links: {
    height: 120,
    justifyContent: 'space-between',
  },
  helpfulLink: {
    marginBottom: 15,
  },
})
