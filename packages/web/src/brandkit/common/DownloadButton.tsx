import * as React from 'react'
import { brandStyles } from 'src/brandkit/common/constants'
import { AssetTypes, trackDownload } from 'src/brandkit/tracking'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import Download from 'src/icons/Download'
import Button, { BTN } from 'src/shared/Button.3'
import { colors } from 'src/styles'
interface Props {
  uri: string
  trackingData: { name: string; type: AssetTypes }
}

export default withNamespaces(NameSpaces.brand)(function DownloadButton({
  t,
  uri,
  trackingData,
}: Props & I18nProps) {
  const onPress = React.useCallback(async () => {
    await trackDownload(trackingData)
  }, [trackingData])

  return (
    <Button
      kind={BTN.TERTIARY}
      text={t('downloadAssetBtn')}
      target={uri && uri.startsWith('http') && !uri.endsWith('.zip') ? '_blank' : undefined}
      href={uri}
      onPress={onPress}
      style={brandStyles.button}
      iconRight={<Download size={12} color={colors.primary} />}
    />
  )
})
