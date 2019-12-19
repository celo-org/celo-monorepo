import * as React from 'react'
import { brandStyles } from 'src/brandkit/common/constants'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import Download from 'src/icons/Download'
import Button, { BTN } from 'src/shared/Button.3'
import { colors } from 'src/styles'

interface Props {
  uri: string
}

export default withNamespaces(NameSpaces.brand)(function DownloadButton({
  t,
  uri,
}: Props & I18nProps) {
  return (
    <Button
      kind={BTN.TERTIARY}
      text={t('downloadAssetBtn')}
      target={uri && uri.startsWith('http') && !uri.endsWith('.zip') ? '_blank' : undefined}
      href={uri}
      style={brandStyles.button}
      iconRight={<Download size={12} color={colors.primary} />}
    />
  )
})
