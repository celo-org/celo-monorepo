// Feature flags
export const features = {
  SHOW_SHOW_REWARDS_APP_LINK: false,
  USE_COMMENT_ENCRYPTION: true,
  SHOW_ADD_FUNDS: true,
  DATA_SAVER: true,
  PHONE_NUM_METADATA_IN_TRANSFERS: true,
  VERIFICATION_FORNO_RETRY: true,
  CUSD_MOONPAY_ENABLED: false,
  SHOW_CASH_OUT: false,
  PNP_USE_DEK_FOR_AUTH: true,
  USE_PHONE_NUMBER_PRIVACY: true,
}

export const pausedFeatures = {
  INVITE: true,
}

// Country specific features, unlisted countries are set to `false` by default
// Using 2 letters alpha code. See https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
export const countryFeatures = {
  RESTRICTED_CP_DOTO: {
    PH: true,
  },
}
