import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { H1 } from 'src/fonts/Fonts'
import OpenGraph from 'src/header/OpenGraph'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import SideTitledSection from 'src/layout/SideTitledSection'
import menuItems, { CeloLinks } from 'src/shared/menu-items'
import { HEADER_HEIGHT } from 'src/shared/Styles'
import { fonts, standardStyles, textStyles } from 'src/styles'
import { HelpfullLink } from './HelpfullLink'

class TermsPortal extends React.PureComponent<I18nProps> {
  static getInitialProps() {
    return { namespacesRequired: [NameSpaces.terms, NameSpaces.common] }
  }
  render() {
    const { t } = this.props
    return (
      <>
        <OpenGraph title={t('title')} path={NameSpaces.terms} description={t('metaDescription')} />
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
          <SideTitledSection title={t('helpfulLinks')}>
            <View style={styles.links}>
              <HelpfullLink text={t('userAgreementLink')} href={CeloLinks.agreement} />
              <HelpfullLink text={t('faq')} href={menuItems.FAQ.link} />
              <HelpfullLink text={t('privacyPolicy')} href={menuItems.PRIVACY.link} />
              <HelpfullLink text={t('disclaimer')} href={CeloLinks.disclaimer} />
            </View>
          </SideTitledSection>
          <SideTitledSection title={t('privacy')}>
            <Text style={[fonts.p, standardStyles.elementalMarginBottom]}>{t('privacyNote')}</Text>
            <HelpfullLink text={t('privacyLink')} href={CeloLinks.privacyDocs} />
          </SideTitledSection>
        </View>
      </>
    )
  }
}

export default withNamespaces(NameSpaces.terms)(TermsPortal)

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
