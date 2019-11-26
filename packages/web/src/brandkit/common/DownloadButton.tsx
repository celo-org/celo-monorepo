import { brandStyles } from 'src/brandkit/common/constants'
import { NameSpaces, withNamespaces } from 'src/i18n'
import Download from 'src/icons/Download'
import Button, { BTN } from 'src/shared/Button.3'
import { colors } from 'src/styles'

export default withNamespaces(NameSpaces.brand)(function DownloadButton({ t, uri }) {
  return (
    <Button
      kind={BTN.TERTIARY}
      text={t('downloadAssetBtn')}
      href={uri}
      style={brandStyles.button}
      iconRight={<Download size={12} color={colors.primary} />}
    />
  )
})
