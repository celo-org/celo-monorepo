import { RenderNode } from '@contentful/rich-text-react-renderer'
import { BLOCKS, INLINES } from '@contentful/rich-text-types'
import { Image, Text, View } from 'react-native'
import YouTube from 'react-youtube'
import Showcase from 'src/experience/common/Showcase'
import { H1, H2, H3, H4 } from 'src/fonts/Fonts'
import Button from 'src/shared/Button.3'
import InlineAnchor from 'src/shared/InlineAnchor'
import { fonts, standardStyles } from 'src/styles'
import { AssetTypes } from '../brandkit/tracking'
import { brandStyles } from 'src/experience/common/constants'
import { Asset, Sys } from 'contentful'

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
  console.warn(node)
  const fields = node.data.target.fields
  debugger
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
      return (
        <View style={brandStyles.tiling}>
          {node.data.target.fields.content.map(renderGridContent)}
        </View>
      )
    case 'iFrameEmbed':
      const url = node.data.target.fields.url
      return <iframe src={url} height="500px" />
    case 'tile':
      return (
        <Showcase
          key={node.data.target.id}
          ratio={1}
          assetType={AssetTypes.illustration}
          description={fields.description}
          name={fields.title}
          preview={fields.image}
          uri={fields.uri}
          loading={false}
          size={120}
        />
      )
    case 'video':
      return <YouTube videoId={fields.youtubeID} />
    default:
      console.warn(node)
      return null
  }
}

interface Content {
  sys: Sys
  fields: {
    description: string
    title: string
    image: Asset
  }
}

function renderGridContent(content: Content) {
  console.warn(content)
  return (
    <Showcase
      key={content.sys.id}
      ratio={1.5}
      assetType={AssetTypes.illustration}
      description={content.fields.description}
      name={content.fields.title}
      preview={content.fields.image.fields.file.url}
      uri={''}
      loading={false}
      size={180}
    />
  )
}
