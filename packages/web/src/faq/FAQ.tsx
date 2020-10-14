import { Document } from '@contentful/rich-text-types'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { H1 } from 'src/fonts/Fonts'
import OpenGraph from 'src/header/OpenGraph'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { HEADER_HEIGHT } from 'src/shared/Styles'
import { fonts, standardStyles, textStyles } from 'src/styles'

import { documentToReactComponents } from '@contentful/rich-text-react-renderer'
import { renderNode } from 'src/experience/contentful/nodes'
const OPTIONS = {
  renderNode,
}
interface FAQItem {
  id: string
  question: string
  answer: Document
}
export interface Props {
  title: string
  list: FAQItem[]
}

class FAQ extends React.Component<I18nProps & Props> {
  render() {
    const { t, list } = this.props
    return (
      <>
        <OpenGraph title={t('title')} path={'/faq'} description={t('description')} />
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
          {list.map((faq) => (
            <Section key={faq.id} title={faq.question}>
              {documentToReactComponents(faq.answer, OPTIONS)}
            </Section>
          ))}
        </View>
      </>
    )
  }
}

function Section({ title, children }) {
  return (
    <GridRow
      desktopStyle={standardStyles.blockMargin}
      tabletStyle={standardStyles.blockMarginTablet}
      mobileStyle={standardStyles.blockMarginMobile}
    >
      <Cell span={Spans.fourth}>
        <Text style={fonts.h3Mobile}>{title}</Text>
      </Cell>
      <Cell span={Spans.half}>
        <Text style={fonts.p}>{children}</Text>
      </Cell>
    </GridRow>
  )
}
export default withNamespaces('faq')(FAQ)

const styles = StyleSheet.create({
  container: {
    marginTop: HEADER_HEIGHT,
    paddingTop: HEADER_HEIGHT,
  },
})
