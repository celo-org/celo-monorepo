import MarkdownJSX from 'markdown-to-jsx'
import * as React from 'react'
import { Text, View } from 'react-native'
import PlanningDocs from 'src/experience/eventkit/PlanningDocs'
import {
  DesignForAll,
  EmbodyHumility,
  InnovatingOnMoney,
  StrivingForBeauty,
} from 'src/experience/eventkit/Tenent'
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
    h3: ({ children }) => (
      <View style={standardStyles.elementalMarginTop}>
        <H3>{children}</H3>
      </View>
    ),
    h4: H4,
    li: Li,
    ul: List,
    p: P,
    span: P,
    a: InlineAnchor,
    DesignForAll,
    StrivingForBeauty,
    EmbodyHumility,
    InnovatingOnMoney,
    PlanningDocs,
  },
}
export default function Markdown({ source }) {
  return <MarkdownJSX children={source} options={OPTIONS} />
}
