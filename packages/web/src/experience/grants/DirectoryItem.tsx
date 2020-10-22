import { Asset } from 'contentful'
import * as React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import Octocat from 'src/icons/Octocat'
import Outbound from 'src/shared/Outbound'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'

export interface Props {
  name: string
  headline: string
  description: string
  website: string
  repo: string
  logo: string
  logoHeight: number
  logoWidth: number
}

export interface ContentFulItem {
  name: string
  headline: string
  description: string
  website: string
  repo: string
  logo: Asset
}

function useWidth(): [number, (e) => void] {
  const [width, setWidth] = React.useState(0)
  function onLayout(event) {
    setWidth(event.nativeEvent.layout.width)
  }
  return [width, onLayout]
}

export default React.memo(function DirectoryItem(props: Props) {
  return (
    <View>
      <View style={styles.logoAndLink}>
        <ContentfulImage
          image={props.logo}
          maxHeight={props.logoHeight}
          maxWidth={props.logoWidth}
        />
        <View style={styles.link}>
          <Outbound url={props.website} />
        </View>
      </View>
      <Text style={nameStyle}>{props.name}</Text>
      <Text style={headlineStyle}>{props.headline}</Text>
      <Text style={[fonts.legal, standardStyles.elementalMarginBottom]}>{props.description}</Text>
      {props.repo && (
        <a href={props.repo} target="_blank" rel="noopener">
          {' '}
          <Octocat color={colors.dark} size={20} />
        </a>
      )}
    </View>
  )
})

function ContentfulImage({ image, maxHeight, maxWidth }) {
  const [potentialWidth, onLayout] = useWidth()
  const ratio = maxWidth / maxHeight
  const realHeight = Math.round(Math.min(potentialWidth / ratio, 100))
  const realWidth = Math.round(Math.min(potentialWidth, realHeight * ratio))
  return (
    <View
      style={{
        width: potentialWidth ? realWidth : '100%',
        maxWidth,
        height: 100,
        justifyContent: 'center',
      }}
      onLayout={onLayout}
    >
      {potentialWidth && (
        <Image
          source={{ uri: `${image}?w=${realWidth}&h=${realHeight}` }}
          style={{ width: realWidth, height: realHeight }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  name: { marginTop: 8 },
  headline: {
    marginBottom: 12,
  },
  logoAndLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  link: { marginHorizontal: 12 },
})

const nameStyle = [fonts.legal, textStyles.heavy, styles.name]
const headlineStyle = [fonts.legal, textStyles.italic, styles.headline]
