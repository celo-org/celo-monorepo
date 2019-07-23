import * as React from 'react'
import FadeIn from 'react-lazyload-fadein'
import { StyleSheet, View } from 'react-native'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Card from 'src/shared/Card'
import { Articles as Props } from 'fullstack/ArticleProps'

export default function Articles(props: Props) {
  const { articles } = props
  return (
    <FadeIn>
      {(onLoad) => {
        return (
          <View>
            <GridRow allStyle={styles.body}>
              {articles.map((article, key) => {
                return (
                  <Cell key={key} span={Spans.third} tabletSpan={Spans.half} style={styles.cell}>
                    <Card {...article} onLoad={onLoad} />
                  </Cell>
                )
              })}
            </GridRow>
          </View>
        )
      }}
    </FadeIn>
  )
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  cell: {
    justifyContent: 'space-between',
  },
})
