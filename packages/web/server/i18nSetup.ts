const rtlLocales = [
  'ae', // Avestan
  'ar', // Arabic
  'arc', // Aramaic
  'bcc', // Southern Balochi
  'bqi', // Bakthiari
  'ckb', // Sorani
  'dv', // Dhivehi
  'fa',
  'far', // Persian
  'glk', // Gilaki
  'he',
  'iw', // Hebrew
  'khw', // Khowar
  'ks', // Kashmiri
  'ku', // Kurdish
  'mzn', // Mazanderani
  'nqo', // N'Ko
  'pnb', // Western Punjabi
  'ps', // Pashto
  'sd', // Sindhi
  'ug', // Uyghur
  'ur', // Urdu
  'yi', // Yiddish
]

const isLocaleRTL = (locale) => rtlLocales.indexOf(locale) >= 0

export { isLocaleRTL }
