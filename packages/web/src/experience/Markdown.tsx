import MarkdownJSX from 'markdown-to-jsx'
import * as React from 'react'
import { Text } from 'react-native'
import { H1, H2, H3, H4, Li, Ul } from 'src/fonts/Fonts'
import InlineAnchor from 'src/shared/InlineAnchor'
import { fonts, standardStyles } from 'src/styles'

function P({ children }) {
  return (
    <Text
      style={[
        fonts.p,
        standardStyles.halfElement,
        // @ts-ignore
        { display: 'block' },
      ]}
    >
      {children}
    </Text>
  )
}

function List({ children }) {
  return <Ul style={{ marginLeft: 20 }}>{children}</Ul>
}

const OPTIONS = {
  overrides: {
    h1: H1,
    h2: H2,
    h3: H3,
    h4: H4,
    li: Li,
    ul: List,
    p: P,
    a: InlineAnchor,
  },
}
export default function Markdown({ source }) {
  return <MarkdownJSX children={source} options={OPTIONS} />
}
