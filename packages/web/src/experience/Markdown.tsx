import MarkdownJSX from 'markdown-to-jsx'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import PlanningDocs from 'src/experience/eventkit/PlanningDocs'
import {
  DesignForAll,
  EmbodyHumility,
  InnovatingOnMoney,
  StrivingForBeauty,
} from 'src/experience/eventkit/Tenents'
import { H1, H2, H3, H4, Li, Ul } from 'src/fonts/Fonts'
import Button, { BTN } from 'src/shared/Button.3'
import InlineAnchor from 'src/shared/InlineAnchor'
import { fonts, standardStyles } from 'src/styles'
import { isExternalLink } from 'src/utils/utils'
import { trackOpen, Types } from './eventkit/tracking'
export interface Attributes {
  title: string
  description: string
}

function P({ children }) {
  return <Text style={[fonts.p, standardStyles.halfElement, styles.block]}>{children}</Text>
}

function SmartAnchor({ children, href }) {
  const target = isExternalLink(href) ? '_blank' : undefined

  return (
    <InlineAnchor target={target} href={href}>
      {children}
    </InlineAnchor>
  )
}

function PrimeButton({
  children,
  href,
  external,
}: {
  children: string
  href: string
  external?: boolean
}) {
  const track = React.useCallback(() => trackOpen({ name: children, type: Types.Action }), [
    children,
  ])

  return (
    <Button
      style={standardStyles.halfElement}
      kind={BTN.PRIMARY}
      text={children}
      href={href}
      onPress={track}
      target={external ? '_blank' : ''}
    />
  )
}

const styles = StyleSheet.create({
  block: { display: 'block' },
  list: { marginLeft: 20 },
})

const OPTIONS = {
  overrides: {
    h1: {
      component: H1,
      props: {
        style: styles.block,
      },
    },
    h2: {
      component: H2,
      props: {
        style: [styles.block, standardStyles.blockMarginTopTablet],
      },
    },
    h3: ({ children }) => (
      <View style={standardStyles.blockMarginTopTablet}>
        <H3>{children}</H3>
      </View>
    ),
    h4: {
      component: H4,
      props: { style: [standardStyles.elementalMargin, styles.block] },
    },
    li: Li,
    ul: {
      component: Ul,
      props: {
        style: styles.list,
      },
    },
    p: P,
    span: P,
    a: SmartAnchor,
    DesignForAll,
    StrivingForBeauty,
    EmbodyHumility,
    InnovatingOnMoney,
    PlanningDocs,
    button: PrimeButton,
  },
}
export default function Markdown({ source }) {
  return <MarkdownJSX children={source} options={OPTIONS} />
}
