// Feature flags
export const features = {
  SHOW_SHOW_REWARDS_APP_LINK: false,
  USE_COMMENT_ENCRYPTION: true,
  SHOW_ADD_FUNDS: true,
  DATA_SAVER: true,
  PHONE_NUM_METADATA_IN_TRANSFERS: true,
  VERIFICATION_FORNO_RETRY: true,
  CUSD_MOONPAY_ENABLED: false,
  SHOW_CASH_OUT: true,
  PNP_USE_DEK_FOR_AUTH: true,
  KOMENCI: true,
  ESCROW_WITHOUT_CODE: true,
  SHORT_VERIFICATION_CODES: false,
}

export const pausedFeatures = {
  INVITE: true,
}

// Country specific features, unlisted countries are set to `false` by default
// Using 2 letters alpha code. See https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
export const countryFeatures = {
  RESTRICTED_CP_DOTO: {
    JP: true,
    PH: true,
  },
  SANCTIONED_COUNTRY: {
    BD: true,
    BO: true,
    CN: true,
    CU: true,
    DZ: true,
    EC: true,
    EG: true,
    IQ: true,
    IR: true,
    KP: true,
    KR: true,
    LA: true,
    LB: true,
    MA: true,
    MM: true,
    MZ: true,
    NP: true,
    PK: true,
    SD: true,
    SS: true,
    SY: true,
    TZ: true,
    VE: true,
    VN: true,
  },
  MOONPAY_DISABLED: {
    US: true,
  },
  PONTO_SUPPORTED: {
    PH: true,
  },
  KOTANI_SUPPORTED: {
    KE: true,
  },
  FIAT_SPEND_ENABLED: {
    PH: true,
  },
}
