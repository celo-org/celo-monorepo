import * as React from 'react'
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native'
import { H4 } from 'src/fonts/Fonts'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import AspectRatio from 'src/shared/AspectRatio'
import { colors, fonts, standardStyles } from 'src/styles'

interface FellowProps {
  image: ImageSourcePropType
  name: string
  location: string
  role: string
  quote: string
  text: string | React.ReactNode
  color: colors
  flip: boolean
}

export default class Fellow extends React.PureComponent<FellowProps> {
  render() {
    const { image, name, location, role, quote, text, color, flip } = this.props
    return (
      <View>
        <GridRow
          // allStyle={standardStyles.centered}
          mobileStyle={standardStyles.blockMarginMobile}
          tabletStyle={standardStyles.blockMarginTablet}
          desktopStyle={[standardStyles.blockMargin, flip && styles.flip]}
        >
          <Cell span={Spans.half} tabletSpan={Spans.half}>
            <AspectRatio style={styles.imageContainer} ratio={530 / 615}>
              <Image source={image} style={styles.image} />
            </AspectRatio>
          </Cell>
          <Cell span={Spans.half}>
            <View>
              <H4>{name}</H4>
              <Text style={fonts.h5}>
                {location} | {role}
              </Text>
              <H4
                style={[
                  { color },
                  standardStyles.elementalMarginTop,
                  standardStyles.blockMarginBottom,
                ]}
              >
                {quote}
              </H4>
              <Text style={fonts.p}>{text}</Text>
            </View>
          </Cell>
        </GridRow>
      </View>
    )
  }
}
const styles = StyleSheet.create({
  image: {
    height: '100%',
    width: '100%',
  },
  imageContainer: {
    width: '100%',
  },
  flip: { flexDirection: 'row-reverse' },
})
