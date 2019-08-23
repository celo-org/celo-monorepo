export function getTransferAttributes() {
  let comment: string | null = this.decryptComment(type)
  const timeFormatted = formatFeedTime(timestamp, i18n)
  const dateTimeFormatted = getDatetimeDisplayString(timestamp, t, i18n)
  const currencyStyle = getCurrencyStyles(resolveCurrency(symbol), type)
  const isPending = status === TransactionStatus.Pending
  const opacityStyle = { opacity: isPending ? 0.3 : 1 }

  let contactImage, fullName

  // TODO move this out to a seperate file, too much clutter here
  if (type === TransactionTypes.VERIFICATION_FEE) {
    contactImage = <Image source={faucetIcon} style={styles.image} />
    fullName = t('verificationFee')
    comment = null
  } else if (type === TransactionTypes.VERIFICATION_REWARD) {
    contactImage = this.renderRewardIcon()
    fullName = t('verifierReward')
    comment = null
  } else if (type === TransactionTypes.FAUCET) {
    contactImage = <Image source={faucetIcon} style={styles.image} />
    fullName = DEFAULT_TESTNET ? `Celo ${_.startCase(DEFAULT_TESTNET)} Faucet` : 'Celo Faucet'
    comment = null
  } else if (type === TransactionTypes.INVITE_SENT) {
    contactImage = <Image source={inviteVerifyFee} style={styles.image} />
    const inviteeE164Number = invitees[address]
    const inviteeRecipient = recipientCache[inviteeE164Number]
    fullName = inviteeE164Number
      ? `${t('invited')} ${inviteeRecipient ? inviteeRecipient.displayName : inviteeE164Number}`
      : t('inviteFlow11:inviteSent')
    comment = null
  } else if (type === TransactionTypes.INVITE_RECEIVED) {
    contactImage = <Image source={inviteVerifyFee} style={styles.image} />
    fullName = t('inviteFlow11:inviteReceived')
    comment = null
  } else {
    const recipient = getRecipientFromAddress(address, addressToE164Number, recipientCache)
    if (type === TransactionTypes.RECEIVED || type === TransactionTypes.SENT) {
      fullName = recipient ? recipient.displayName : _.capitalize(t(_.camelCase(type) + 'To'))
    }
    contactImage = (
      <ContactCircle address={address} size={avatarSize}>
        {!recipient ? <Image source={unknownUserIcon} style={styles.image} /> : null}
      </ContactCircle>
    )
  }
}
