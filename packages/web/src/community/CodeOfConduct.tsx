import frontMatter from 'front-matter'
import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import { IntegratingAnimation } from 'src/community/connect/CodeOfConduct'
import content from 'src/content/code-of-conduct.md'
import Markdown from 'src/experience/Markdown'
import { H1 } from 'src/fonts/Fonts'
import OpenGraph from 'src/header/OpenGraph'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { HEADER_HEIGHT } from 'src/shared/Styles'
import { standardStyles, textStyles } from 'src/styles'

interface Info {
  title: string
  description: string
}
const info = frontMatter<Info>(content)

export default function CodeOfConduct() {
  return (
    <>
      <OpenGraph
        title={info.attributes.title}
        path={'/code-of-conduct'}
        description={info.attributes.description}
      />
      <View style={styles.container}>
        <GridRow
          allStyle={standardStyles.centered}
          desktopStyle={standardStyles.blockMarginBottom}
          tabletStyle={standardStyles.blockMarginBottomTablet}
          mobileStyle={standardStyles.blockMarginBottomMobile}
        >
          <Cell span={Spans.three4th} style={standardStyles.centered}>
            <View style={styles.animation}>
              <IntegratingAnimation darkMode={false} />
            </View>
            <H1 style={textStyles.center}>{info.attributes.title}</H1>
          </Cell>
        </GridRow>
        <GridRow
          allStyle={standardStyles.centered}
          desktopStyle={standardStyles.blockMarginBottom}
          tabletStyle={standardStyles.blockMarginBottomTablet}
          mobileStyle={standardStyles.blockMarginBottomMobile}
        >
          <Cell span={Spans.half}>
            <Markdown source={info.body} />
          </Cell>
        </GridRow>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: HEADER_HEIGHT,
    paddingTop: HEADER_HEIGHT,
  },
  animation: {
    width: 241,
    height: 90,
    marginBottom: 100,
  },
})
