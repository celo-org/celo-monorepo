import * as React from 'react'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import VideoModal from 'src/shared/VideoModal'
import { standardStyles } from 'src/styles'

import image from 'src/join/claire-video-banner.jpg'

type Props = I18nProps

class HomeHero extends React.PureComponent<Props> {
  render() {
    return (
      <>
        <GridRow
          allStyle={[standardStyles.centered, standardStyles.elementalMarginTop]}
          mobileStyle={standardStyles.blockMarginBottomMobile}
          tabletStyle={standardStyles.blockMarginBottomTablet}
          desktopStyle={standardStyles.blockMarginBottom}
        >
          <Cell span={Spans.full}>
            <VideoModal
              previewImage={image}
              videoID={'vwfHiaVzc2E'}
              ariaDescription="Video on working on Celo"
            />
          </Cell>
        </GridRow>
      </>
    )
  }
}

export default withNamespaces('home')(HomeHero)
