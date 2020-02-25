import * as React from 'react'
import { StyleSheet } from 'react-native'
import CoverAction from 'src/dev/CoverAction'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import { CeloLinks } from 'src/shared/menu-items'
import { standardStyles } from 'src/styles'
const docImage = require('src/dev/stable-coin-paper-dark-bg.png')
const sdkImage = require('src/dev/code-coins-dark.png')
const tutorialImg = require('src/dev/educate-dark-bg.png')

type Props = I18nProps & ScreenProps

export default withNamespaces('dev')(
  withScreenSize<Props>(function CoverActions({ t, screen }: Props) {
    return (
      <>
        <GridRow
          desktopStyle={standardStyles.blockMarginBottom}
          tabletStyle={standardStyles.blockMarginBottomTablet}
          mobileStyle={standardStyles.sectionMarginTopMobile}
          allStyle={standardStyles.centered}
        >
          <Cell
            span={Spans.full}
            style={screen === ScreenSizes.MOBILE ? styles.mainMobile : styles.main}
          >
            <CoverAction
              graphic={docImage}
              isMobile={screen === ScreenSizes.MOBILE}
              title={t('coverAction.docs.title')}
              text={t('coverAction.docs.text')}
              link={{ text: t('coverAction.docs.link'), href: CeloLinks.sdkDocs }}
            />
            <CoverAction
              graphic={tutorialImg}
              isMobile={screen === ScreenSizes.MOBILE}
              title={t('coverAction.tutorial.title')}
              text={t('coverAction.tutorial.text')}
              link={{ text: t('coverAction.tutorial.link'), href: CeloLinks.sdkTutorial }}
            />
            <CoverAction
              graphic={sdkImage}
              isMobile={screen === ScreenSizes.MOBILE}
              title={t('coverAction.code.title')}
              text={t('coverAction.code.text')}
              link={{ text: t('coverAction.code.link'), href: CeloLinks.gitHub }}
            />
          </Cell>
        </GridRow>
      </>
    )
  })
)

const styles = StyleSheet.create({
  main: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    transform: [{ translateX: 20 }],
  },
  mainMobile: { justifyContent: 'space-around' },
})
