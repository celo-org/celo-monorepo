import { Articles as Props } from 'fullstack/ArticleProps'
import * as React from 'react'
import FadeIn from 'react-lazyload-fadein'
import { StyleSheet, View } from 'react-native'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Card from 'src/shared/Card'
import { standardStyles } from 'src/styles'

interface OwnProps {
  loading: boolean
}

type voidFunc = () => void

export default function Articles(props: Props & OwnProps) {
  const { articles, loading } = props

  if (loading) {
    return (
      <GridRow allStyle={standardStyles.centered}>
        <Cell span={Spans.third} style={standardStyles.centered}>
          {/* {} */}
        </Cell>
      </GridRow>
    )
  }

  return (
    <FadeIn>
      {(onImageLoad: voidFunc) => {
        return (
          <View>
            <GridRow allStyle={styles.body}>
              {articles.map((article, key) => {
                return (
                  <Cell key={key} span={Spans.third} tabletSpan={Spans.half} style={styles.cell}>
                    <Card {...article} onLoad={onImageLoad} />
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
