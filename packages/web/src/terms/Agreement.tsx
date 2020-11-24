import { documentToReactComponents } from '@contentful/rich-text-react-renderer'
import { Document } from '@contentful/rich-text-types'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { renderNode } from 'src/experience/contentful/nodes'
import { H1 } from 'src/fonts/Fonts'
import OpenGraph from 'src/header/OpenGraph'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { HEADER_HEIGHT } from 'src/shared/Styles'
import { fonts, standardStyles, textStyles } from 'src/styles'

const OPTIONS = {
  renderNode,
}

interface Props {
  title: string
  slug: string
  updatedAt: string
  description: string
  sections: Array<{
    name: string
    contentField: Document
  }>
}

class Agreement extends React.PureComponent<I18nProps & Props> {
  static async getInitialProps({ req }) {
    const slug = req.query.slug
    const props = { namespacesRequired: [NameSpaces.terms, NameSpaces.common] }
    try {
      let pageData = {}
      // when run on server import fetching code and run. on client send req to api
      if (req) {
        const getPageBySlug = await import('src/utils/contentful').then((mod) => mod.getPageBySlug)
        pageData = await getPageBySlug(slug, { locale: 'en-US' })
      } else {
        const res = await fetch(`/api/pages/${slug}`)
        pageData = await res.json()
      }
      return { ...pageData, ...props }
    } catch {
      return props
    }
  }
  render() {
    const { t, title, sections, updatedAt, i18n, description } = this.props
    return (
      <>
        <OpenGraph title={title} path={NameSpaces.terms} description={description} />
        <View style={styles.container}>
          <GridRow
            allStyle={standardStyles.centered}
            desktopStyle={standardStyles.blockMarginBottom}
            tabletStyle={standardStyles.blockMarginBottomTablet}
            mobileStyle={standardStyles.blockMarginBottomMobile}
          >
            <Cell span={Spans.fourth}>{}</Cell>
            <Cell span={Spans.three4th} style={standardStyles.centered}>
              <H1 style={textStyles.center}>{title}</H1>
            </Cell>
          </GridRow>
          <GridRow>
            <Cell span={Spans.fourth}>
              <Text style={fonts.h6}>
                {t('updatedOn', { date: toLocaleDate(updatedAt, i18n.language) })}
              </Text>
            </Cell>
            <Cell span={Spans.three4th}>
              {sections.map((section) => {
                return documentToReactComponents(section.contentField, OPTIONS)
              })}
            </Cell>
          </GridRow>
        </View>
      </>
    )
  }
}

function toLocaleDate(dateString: string, locale: string) {
  return new Date(dateString).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default withNamespaces(NameSpaces.terms)(Agreement)

const styles = StyleSheet.create({
  container: {
    marginTop: HEADER_HEIGHT,
    paddingTop: HEADER_HEIGHT,
  },
})
