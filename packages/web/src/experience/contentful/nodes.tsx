import { INLINES, BLOCKS } from '@contentful/rich-text-types'
import { RenderNode } from '@contentful/rich-text-react-renderer'

import Button, { BTN } from 'src/shared/Button.3'
import { H1, H2, H3, H4 } from 'src/fonts/Fonts'
import InlineAnchor from 'src/shared/InlineAnchor'
import { fonts } from 'src/styles'
import { Text } from 'react-native'

export const renderNode: RenderNode = {
  [BLOCKS.HEADING_1]: (_, children) => {
    return <H1>{children}</H1>
  },
  [BLOCKS.HEADING_2]: (_, children) => {
    return <H2>{children}</H2>
  },
  [BLOCKS.HEADING_3]: (_, children) => {
    return <H3>{children}</H3>
  },
  [BLOCKS.HEADING_4]: (_, children) => {
    return <H4>{children}</H4>
  },
  [BLOCKS.HEADING_5]: (_, children) => {
    return <Text style={fonts.h5}>{children}</Text>
  },
  [BLOCKS.PARAGRAPH]: (_, children) => {
    return <Text style={fonts.p}>{children}</Text>
  },
  [INLINES.HYPERLINK]: (node, children) => {
    return <InlineAnchor href={node.data.uri}>{children as string}</InlineAnchor>
  },
  [INLINES.EMBEDDED_ENTRY]: (node) => {
    switch (node.data?.target?.sys?.contentType?.sys?.id) {
      case 'button':
        const fields = node.data.target.fields
        return <Button text={fields.words} href={fields.href} kind={BTN.PRIMARY} />
      default:
        console.warn(node)
        return null
    }
  },
}
