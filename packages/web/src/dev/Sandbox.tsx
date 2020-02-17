import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Analytics from 'src/analytics/analytics'
import CodeEditor from 'src/dev/CodeEditor'
import { H2, H3 } from 'src/fonts/Fonts'
import { NameSpaces, useTranslation } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import { fonts, standardStyles, textStyles } from 'src/styles'
export default function Sandbox() {
  const { t } = useTranslation(NameSpaces.dev)
  return (
    <View style={standardStyles.darkBackground}>
      <GridRow
        desktopStyle={standardStyles.sectionMarginTop}
        tabletStyle={standardStyles.sectionMarginTopTablet}
        mobileStyle={standardStyles.sectionMarginTopMobile}
      >
        <Cell span={Spans.full}>
          <H3 style={textStyles.invert}>{t('sandbox.overtitle')}</H3>
          <H2 style={[textStyles.invert, standardStyles.elementalMargin]}>{t('sandbox.title')}</H2>
          <Text style={[fonts.p, textStyles.invert]}>{t('sandbox.explainer')}</Text>
          <View style={[standardStyles.centered, standardStyles.blockMarginTablet]}>
            <View style={[standardStyles.blockMarginMobile, styles.codeBox]}>
              <CodeEditor />
              <View style={[styles.absoluteCenter, standardStyles.centered]}>
                <Button
                  kind={BTN.PRIMARY}
                  href="https://repl.it/@celoOrg/contractkit"
                  text={t('sandbox.btn')}
                  target="_blank"
                  onPress={trackSandBoxClick}
                  size={SIZE.big}
                />
              </View>
            </View>
          </View>
        </Cell>
      </GridRow>
    </View>
  )
}

async function trackSandBoxClick() {
  await Analytics.track('sandbox_engaged_with')
}

const styles = StyleSheet.create({
  codeBox: {
    height: '100%',
    maxHeight: '80vh',
    width: '100%',
  },
  absoluteCenter: { position: 'absolute', right: 0, left: 0, top: 0, bottom: 0 },
})
