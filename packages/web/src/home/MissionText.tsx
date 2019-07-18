import * as React from 'react'
import { Text } from 'react-native'
import { H1 } from 'src/fonts/Fonts'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { fonts, standardStyles, textStyles } from 'src/styles'

function MissionText({ t }: I18nProps) {
  return (
    <GridRow
      desktopStyle={standardStyles.sectionMargin}
      tabletStyle={standardStyles.sectionMarginTablet}
      mobileStyle={standardStyles.sectionMarginMobile}
      allStyle={standardStyles.centered}
    >
      <Cell span={Spans.half}>
        <H1 style={[textStyles.center, standardStyles.elementalMarginBottom]}>
          {t('missionMeaning')}
        </H1>
        <Text style={fonts.p}>{t('missionText')}</Text>
      </Cell>
    </GridRow>
  )
}

export default withNamespaces('about')(React.memo(MissionText))
