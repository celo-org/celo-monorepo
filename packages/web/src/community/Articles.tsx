import { Articles as Props } from 'fullstack/ArticleProps'
import * as React from 'react'
import FadeIn from 'react-lazyload-fadein'
import { StyleSheet, View } from 'react-native'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Card from 'src/shared/Card'
import Spinner from 'src/shared/Spinner'
import { colors, standardStyles } from 'src/styles'

interface OwnProps {
  loading: boolean
}

type voidFunc = () => void

export default function Articles(props: Props & OwnProps) {
  const { articles, loading } = props

  if (loading) {
    return <Placeholder />
  }

  return (
    <FadeIn placeholder={<Placeholder />}>
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

function Placeholder() {
  return (
    <GridRow allStyle={[styles.body, standardStyles.centered]}>
      <Cell span={Spans.third} tabletSpan={Spans.half}>
        <View style={[standardStyles.centered, styles.placeholder]}>
          <Spinner color={colors.white} size={'medium'} />
        </View>
      </Cell>
      <Cell span={Spans.third} tabletSpan={Spans.half}>
        <View style={[standardStyles.centered, styles.placeholder]}>
          <Spinner color={colors.white} size={'medium'} />
        </View>
      </Cell>
      <Cell span={Spans.third} tabletSpan={Spans.half}>
        <View style={[standardStyles.centered, styles.placeholder]}>
          <Spinner color={colors.white} size={'medium'} />
        </View>
      </Cell>
    </GridRow>
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
  placeholder: {
    marginTop: 15,
    height: 500,
    width: '100%',
    backgroundColor: colors.light,
  },
})
