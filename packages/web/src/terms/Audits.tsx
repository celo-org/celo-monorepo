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

class Audits extends React.PureComponent<I18nProps> {
  static getInitialProps() {
    return { namespacesRequired: [NameSpaces.audits, NameSpaces.common] }
  }
  render() {
    const { t } = this.props
    return (
      <>
        <OpenGraph title={t('title')} path={NameSpaces.audits} description={t('metaDescription')} />
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
          <SideTitledSection span={Spans.three4th} title={t('sideTitle')}>
            <Text style={[fonts.p, standardStyles.elementalMarginBottom]}>{t('openZeppelin')}</Text>
            <View style={styles.links}>
              <HelpfullLink
                text={t('download')}
                href={'https://blog.openzeppelin.com/celo-contracts-audit'}
              />
            </View>
          </SideTitledSection>
        </View>
      </>
    )
  }
}

function HelpfullLink({ text, href }) {
  return (
    <Button
      kind={BTN.NAKED}
      style={styles.link}
      text={text}
      href={href}
      size={SIZE.normal}
      target="_blank"
    />
  )
}

export default withNamespaces(NameSpaces.audits)(Audits)

const styles = StyleSheet.create({
  container: {
    marginTop: HEADER_HEIGHT,
    paddingTop: HEADER_HEIGHT,
    minHeight: 450,
  },
  links: {
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
  link: {
    marginRight: 30,
  },
})
