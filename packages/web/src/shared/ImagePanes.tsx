import * as React from 'react'
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import AspectRatio from 'src/shared/AspectRatio'
import Fade from 'src/shared/AwesomeFade'
import { fonts, textStyles } from 'src/styles'

interface Pane {
  source: ImageSourcePropType
  caption: string
}

interface Props {
  reverse?: boolean
  half: Pane
  quarter: Pane
  secondQuarter: Pane
}

export function ImagePanes({ half, quarter, secondQuarter, reverse }: Props) {
  return (
    <GridRow desktopStyle={reverse && styles.reverse} tabletStyle={reverse && styles.reverse}>
      <Cell span={Spans.half} style={styles.cell}>
        <Fade>
          <View style={styles.frame}>
            <AspectRatio ratio={480 / 300}>
              <Image style={styles.image} resizeMode="cover" source={quarter.source} />
            </AspectRatio>
            <Text style={[fonts.legal, textStyles.caption]}>{quarter.caption}</Text>
          </View>
        </Fade>
        <Fade>
          <View style={styles.frame}>
            <AspectRatio ratio={480 / 300}>
              <Image style={styles.image} resizeMode="cover" source={secondQuarter.source} />
            </AspectRatio>
            <Text style={[fonts.legal, textStyles.caption]}>{secondQuarter.caption}</Text>
          </View>
        </Fade>
      </Cell>
      <Cell span={Spans.half} style={styles.cell}>
        <Fade>
          <View style={styles.frame}>
            <AspectRatio ratio={480 / 640}>
              <Image style={styles.image} resizeMode="cover" source={half.source} />
            </AspectRatio>
            <Text style={[fonts.legal, textStyles.caption]}>{half.caption}</Text>
          </View>
        </Fade>
      </Cell>
    </GridRow>
  )
}

const styles = StyleSheet.create({
  reverse: {
    flexDirection: 'row-reverse',
  },
  image: {
    height: '100%',
  },
  caption: {
    paddingTop: 5,
  },
  frame: {
    marginBottom: 20,
  },
  cell: {
    paddingVertical: 0,
  },
})
