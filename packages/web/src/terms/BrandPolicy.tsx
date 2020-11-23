import { View } from 'react-native'
import brandPolicyContent from 'src/content/brand-policy.md'
import Markdown from 'src/experience/Markdown'
import { H1 } from 'src/fonts/Fonts'
import OpenGraph from 'src/header/OpenGraph'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { standardStyles, textStyles } from 'src/styles'

export default function BrandPolicy() {
  return (
    <>
      <OpenGraph
        title="Celo Brand Policy"
        path="/brand-policy"
        description="How to use the Brand Assets (trademark, copyrights & intellectual property) to promote the Celo community while protecting Celo Brand idenity."
      />
      <View>
        <GridRow
          allStyle={standardStyles.centered}
          desktopStyle={standardStyles.sectionMarginTop}
          tabletStyle={standardStyles.sectionMarginTopTablet}
          mobileStyle={standardStyles.sectionMarginTopMobile}
        >
          <Cell span={Spans.three4th} tabletSpan={Spans.full}>
            <H1 style={textStyles.center}>Celo Foundation Brand Policy</H1>
          </Cell>
        </GridRow>
        <GridRow allStyle={standardStyles.centered}>
          <Cell span={Spans.half} tabletSpan={Spans.three4th}>
            <Markdown source={brandPolicyContent} />
          </Cell>
        </GridRow>
      </View>
    </>
  )
}
