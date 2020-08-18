import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { H1 } from 'src/fonts/Fonts'
import OpenGraph from 'src/header/OpenGraph'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import SideTitledSection from 'src/layout/SideTitledSection'
import { HEADER_HEIGHT } from 'src/shared/Styles'
import { fonts, standardStyles, textStyles } from 'src/styles'
import { HelpfullLink } from 'src/terms/HelpfullLink'
import { Languages } from 'src/utils/languages'

interface Props {
  press: any[]
}

class PressPage extends React.PureComponent<I18nProps & Props> {
  static async getInitialProps(context) {
    let press = []
    try {
      if (context.req) {
        const getpress = await import('src/../server/fetchPress')
        press = await getpress.default()
      } else {
        press = await fetch(`/api/press`).then((result) => result.json())
      }
      return { press }
    } catch {
      return { press }
    }
  }
  render() {
    const { t, press, i18n } = this.props

    const formated = press
      .filter((article) => article.language === Languages[i18n.language])
      .reduce(groupByMonth, {})

    return (
      <>
        <OpenGraph
          title={'Celo | Press'}
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
          {Object.keys(formated).map((date) => {
            return (
              <SideTitledSection
                key={date}
                span={Spans.three4th}
                title={new Date(date).toLocaleDateString(this.props.i18n.language, DATE_FORMAT)}
              >
                {formated[date].map((item) => (
                  <View style={styles.reference} key={item.title}>
                    <Text style={[fonts.p, textStyles.heavy]}>{item.title}</Text>
                    <Text style={fonts.p}>
                      <Text style={textStyles.italic}>
                        {t('by')} {item.publication}{' '}
                      </Text>
                      {item.link && <HelpfullLink text={t('read')} href={item.link} />}
                    </Text>
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

const DATE_FORMAT = { year: 'numeric', month: 'long' }

export default withNamespaces(NameSpaces.press)(PressPage)

const styles = StyleSheet.create({
  container: {
    marginTop: HEADER_HEIGHT,
    paddingTop: HEADER_HEIGHT,
    minHeight: 450,
  },
  reference: {
    marginBottom: 40,
    maxWidth: 700,
  },
})

export function groupByMonth(previous: any, current) {
  const originDate = new Date(current.date)

  originDate.setDate(14)

  const groupedDate = originDate.toISOString().split('T')[0]

  const month = (previous[groupedDate] = previous[groupedDate] || [])

  month.push(current)

  return previous
}
