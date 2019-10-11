import * as React from 'react'
import { StyleSheet } from 'react-native'
import CoverAction from 'src/dev/CoverAction'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import { CeloLinks } from 'src/shared/menu-items'
import { standardStyles } from 'src/styles'
const docImage = require('src/dev/Documentation.png')
const sdkImage = require('src/dev/SDK.png')
const faucetImage = require('src/dev/Faucet.png')
const evmImg = require('src/dev/features/evm.png')

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
            span={Spans.three4th}
            style={screen === ScreenSizes.MOBILE ? styles.mainMobile : styles.main}
          >
            <CoverAction
              graphic={docImage}
              isMobile={screen === ScreenSizes.MOBILE}
              title={t('coverAction.docs.title')}
              text={t('coverAction.docs.text')}
              link={{ text: t('coverAction.docs.link'), href: CeloLinks.docs }}
            />
            <CoverAction
              graphic={faucetImage}
              isMobile={screen === ScreenSizes.MOBILE}
              title={t('coverAction.faucet.title')}
              text={t('coverAction.faucet.text')}
              link={{ text: t('coverAction.faucet.link'), href: CeloLinks.faucet }}
            />
          </Cell>
        </GridRow>
        <GridRow
          desktopStyle={standardStyles.sectionMarginBottom}
          tabletStyle={standardStyles.sectionMarginBottomTablet}
          mobileStyle={standardStyles.sectionMarginBottomMobile}
          allStyle={standardStyles.centered}
        >
          <Cell
            span={Spans.three4th}
            style={screen === ScreenSizes.MOBILE ? styles.mainMobile : styles.main}
          >
            <CoverAction
              graphic={evmImg}
              isMobile={screen === ScreenSizes.MOBILE}
              title={t('coverAction.code.title')}
              text={t('coverAction.code.text')}
              link={{ text: t('coverAction.code.link'), href: CeloLinks.gitHub }}
            />

            <CoverAction
              graphic={sdkImage}
              isMobile={screen === ScreenSizes.MOBILE}
              title={t('coverAction.sdk.title')}
              text={t('coverAction.sdk.text')}
              link={{ text: t('coverAction.sdk.link'), href: CeloLinks.sdkDocs }}
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
    alignItems: 'flex-start',
    transform: [{ translateX: 20 }],
  },
  mainMobile: { justifyContent: 'space-around' },
})
