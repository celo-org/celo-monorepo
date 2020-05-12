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

interface Audit {
  auditor: string
  title: string
  type: 'economics' | 'contracts' | 'security'
  link?: string
}

const DATA: Audit[] = [
  {
    auditor: 'OpenZeppelin',
    title: 'Smart Contract Audit',
    link: 'https://blog.openzeppelin.com/celo-contracts-audit',
    type: 'contracts',
  },
  { auditor: 'Teserakt', title: 'Crypto Library Audit', type: 'security' },
  { auditor: 'Trailofbits', title: 'Security Audit', type: 'security' },
  { auditor: 'Certora', title: 'Formal Verification of Smart Contracts', type: 'contracts' },
  { auditor: 'Gauntlet', title: 'Stability Protocol Analysis', type: 'economics' },
  { auditor: 'Prysm Group', title: 'Economic Analysis', type: 'economics' },
  { auditor: 'NCC', title: 'Reserve Audit', type: 'economics' },
]

const AUDITS = DATA.reduce((agg, current) => {
  const arrayOfType = agg[current.type] || []
  agg[current.type] = [...arrayOfType, current]

  return agg
}, {})

class Audits extends React.PureComponent<I18nProps> {
  static getInitialProps() {
    return { namespacesRequired: [NameSpaces.audits, NameSpaces.common] }
  }
  render() {
    const { t } = this.props
    return (
      <>
        <OpenGraph
          title={'Celo | Audits & Analyses'}
          path={NameSpaces.audits}
          description={t('metaDescription')}
        />
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
          {Object.keys(AUDITS).map((type) => {
            return (
              <SideTitledSection key={type} span={Spans.three4th} title={t(type)}>
                {AUDITS[type].map((audit: Audit) => (
                  <View style={styles.reference} key={audit.title}>
                    <Text style={fonts.p}>
                      {audit.title} by <Text style={textStyles.italic}>{audit.auditor}</Text>
                    </Text>
                    {audit.link && <HelpfullLink text={t('download')} href={audit.link} />}
                  </View>
                ))}
              </SideTitledSection>
            )
          })}
        </View>
      </>
    )
  }
}

export default withNamespaces(NameSpaces.audits)(Audits)

const styles = StyleSheet.create({
  container: {
    marginTop: HEADER_HEIGHT,
    paddingTop: HEADER_HEIGHT,
    minHeight: 450,
  },
  reference: {
    marginBottom: 20,
  },
})
