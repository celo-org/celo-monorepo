import { I18nProps, withNamespaces } from 'src/i18n'
import { GridRow, Cell, Spans } from 'src/layout/GridRow'
import { H2 } from 'src/fonts/Fonts'
import { fonts, standardStyles } from 'src/styles'
import { Text, View } from 'react-native'

import FullCircle from 'src/community/connect/FullCircle'
import Testris from 'src/about/Testris'

function Values({ t }: I18nProps) {
  return (
    <>
      <GridRow
        desktopStyle={standardStyles.sectionMargin}
        tabletStyle={standardStyles.sectionMarginTablet}
        mobileStyle={standardStyles.sectionMarginMobile}
      >
        <Cell span={Spans.half}>
          <Testris />
        </Cell>
        <Cell span={Spans.half} style={{ justifyContent: 'center' }}>
          <H2>{t('value1Title')}</H2>
          <Text style={[fonts.p, standardStyles.elementalMargin]}>{t('value1Text')}</Text>
        </Cell>
      </GridRow>
      <GridRow
        desktopStyle={standardStyles.sectionMarginBottom}
        tabletStyle={standardStyles.sectionMarginBottomTablet}
        mobileStyle={standardStyles.sectionMarginBottomMobile}
      >
        <Cell span={Spans.half}>
          <View style={{ height: 450, transform: [{ translateX: -50 }] }}>
            <FullCircle lightBackground={true} />
          </View>
        </Cell>
        <Cell span={Spans.half} style={{ justifyContent: 'center' }}>
          <H2>{t('value2Title')}</H2>
          <Text style={[fonts.p, standardStyles.elementalMargin]}>{t('value2Text')}</Text>
        </Cell>
      </GridRow>
    </>
  )
}

export default withNamespaces('about')(Values)
