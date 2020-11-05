import { RenderNode } from '@contentful/rich-text-react-renderer'
import { BLOCKS, INLINES } from '@contentful/rich-text-types'
import { Asset, Sys } from 'contentful'
import * as React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import YouTube from 'react-youtube'
import { AssetTypes } from 'src/experience/brandkit/tracking'
import { brandStyles } from 'src/experience/common/constants'
import Showcase from 'src/experience/common/Showcase'
import { contentfulToProps } from 'src/experience/grants/contentfulToProps'
import DirectorySection from 'src/experience/grants/DirectorySection'
import IdeaReadiness from 'src/experience/grants/IdeaReadiness'
import JourneySteps from 'src/experience/grants/JourneySteps'
import { H1, H2, H3, H4 } from 'src/fonts/Fonts'
import { ScreenSizes, useScreenSize } from 'src/layout/ScreenSize'
import Button from 'src/shared/Button.3'
import InlineAnchor from 'src/shared/InlineAnchor'
import { fonts, standardStyles } from 'src/styles'

export const renderNode: RenderNode = {
  [BLOCKS.HEADING_1]: (_, children: string) => {
    return <H1>{children}</H1>
  },
  [BLOCKS.HEADING_2]: (_, children: string) => {
    return <H2 style={standardStyles.blockMarginTopTablet}>{children}</H2>
  },
  [BLOCKS.HEADING_3]: (_, children: string) => {
    return <H3 style={standardStyles.blockMarginTopTablet}>{children}</H3>
  },
  [BLOCKS.HEADING_4]: (_, children: string) => {
    return <H4 style={standardStyles.elementalMargin}>{children}</H4>
  },
  [BLOCKS.HEADING_5]: (_, children: string) => {
    return <Text style={fonts.h5}>{children}</Text>
  },
  [BLOCKS.PARAGRAPH]: (_, children: string) => {
    return <Text style={[fonts.p, standardStyles.halfElement]}>{children}</Text>
  },
  [INLINES.HYPERLINK]: (node, children: string) => {
    return <InlineAnchor href={node.data.uri}>{children}</InlineAnchor>
  },
  [BLOCKS.EMBEDDED_ASSET]: (node) => {
    const file = node.data.target.fields.file
    return <Image source={file.url} style={file.details.image} />
  },
  [BLOCKS.EMBEDDED_ENTRY]: embedded,
  [INLINES.EMBEDDED_ENTRY]: embedded,
}

function embedded(node) {
  const fields = node.data.target.fields
  switch (node.data?.target?.sys?.contentType?.sys?.id) {
    case 'button':
      return (
        <Button
          text={fields.words}
          href={fields.href || fields.assetLink?.fields?.file?.url}
          kind={fields.kind}
        />
      )
    case 'grid':
      const numberAcross = node.data.target.fields.by
      const ratio = node.data.target.fields.tileRatio
      return (
        <View style={[brandStyles.tiling, styles.grid]}>
          {node.data.target.fields.content.map((content: Content) => (
            <Tile
              key={content.sys.id}
              content={content}
              numberAcross={numberAcross}
              ratio={ratio}
            />
          ))}
        </View>
      )
    case 'iFrameEmbed':
      const url = node.data.target.fields.url
      return <iframe src={url} height="500px" />
    case 'video':
      return <YouTube videoId={fields.youtubeID} />
    case 'grantDirectorySection':
      return (
        <DirectorySection
          name={fields.name}
          description={fields.categoryDescription}
          items={fields.items.map(contentfulToProps)}
        />
      )
    case 'grantIdeaReadiness':
      return <IdeaReadiness title={fields.title} caption={fields.caption} stages={fields.stages} />
    case 'steps':
      return <JourneySteps steps={fields.steps} term={fields.stepTerm} />
    default:
      console.info(node.data?.target?.sys?.contentType?.sys?.id)
      return null
  }
}

interface Content {
  sys: Sys
  fields: {
    description: string
    title: string
    image: Asset
    download: Asset
  }
}
// Contentful sends these values as strings
type NumberAcross = '2' | '3' | '4'

interface TileProps {
  content: Content
  numberAcross: NumberAcross
  ratio: number
}

function Tile({ content, numberAcross, ratio }: TileProps) {
  const size = useTileSize(numberAcross)
  const { width, height } = content?.fields?.image?.fields?.file?.details?.image || {}
  const realRatio = width && height ? width / height : ratio || 1
  return (
    <Showcase
      key={content.sys.id}
      ratio={realRatio || 1}
      assetType={AssetTypes.illustration}
      description={content.fields.description}
      name={content.fields.title}
      preview={content?.fields?.image?.fields?.file?.url}
      uri={content?.fields?.download?.fields?.file?.url}
      loading={false}
      size={size}
    />
  )
}

function useTileSize(numberAcross: NumberAcross) {
  const { screen } = useScreenSize()

  if (numberAcross === '2') {
    switch (screen) {
      case ScreenSizes.DESKTOP:
        return 350
      case ScreenSizes.MOBILE:
        return 345
      case ScreenSizes.TABLET:
        return 222
    }
  } else if (numberAcross === '3') {
    switch (screen) {
      case ScreenSizes.DESKTOP:
        return 226
      case ScreenSizes.MOBILE:
        return '100%'
      case ScreenSizes.TABLET:
        return 180
    }
  } else if (numberAcross === '4') {
    return 165
  }
}

const styles = StyleSheet.create({
  grid: { marginHorizontal: -10 },
})
