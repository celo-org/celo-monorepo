const momentTimezone = require('moment-timezone')

import differenceInYears from 'date-fns/esm/differenceInYears'
import format from 'date-fns/esm/format'
import { enUS, es } from 'date-fns/locale'
import { i18n as i18nType, TranslationFunction } from 'i18next'
import * as _ from 'lodash'
import clockSync from 'react-native-clock-sync'
import i18n from 'src/i18n'
import Logger from 'src/utils/Logger'

const clock = new clockSync({})

// Source: https://github.com/webmania2014/angular-source1/blob/master/front/app/filters/tznames.js
// Offsets reversed from original because moment returns with flipped sign
const TIMEZONE_MAPPING: { [key: string]: string | any } = {
  ACDT: 'Australian Central Daylight Savings Time',
  ACST: 'Australian Central Standard Time',
  ACT: {
    '300': 'Acre Time',
    '-480': 'ASEAN Common Time',
  },
  ADT: 'Atlantic Daylight Time',
  AEDT: 'Australian Eastern Daylight Savings Time',
  AEST: 'Australian Eastern Standard Time',
  AFT: 'Afghanistan Time',
  AKDT: 'Alaska Daylight Time',
  AKST: 'Alaska Standard Time',
  ALMT: 'Alma-Ata Time',
  AMST: {
    '-180': 'Amazon Summer Time',
    '300': 'Armenia Summer Time',
  },
  AMT: {
    '-240': 'Amazon Time',
    '240': 'Armenia Time',
  },
  ART: 'Argentina Time',
  AST: {
    '180': 'Arabia Standard Time',
    '-240': 'Atlantic Standard Time',
  },
  AWDT: 'Australian Western Daylight Time',
  AWST: 'Australian Western Standard Time',
  AZOST: 'Azores Standard Time',
  AZT: 'Azerbaijan Time',
  BDT: {
    '480': 'Brunei Time',
    '360': 'Bangladesh Daylight Time',
  },
  BIOT: 'British Indian Ocean Time',
  BIT: 'Baker Island Time',
  BOT: 'Bolivia Time',
  BRST: 'Brasilia Summer Time',
  BRT: 'Brasilia Time',
  BST: {
    '360': 'Bangladesh Standard Time',
    '660': 'Bougainville Standard Time',
    '60': 'British Summer Time',
  },
  BTT: 'Bhutan Time',
  CAT: 'Central Africa Time',
  CCT: 'Cocos Islands Time',
  CDT: {
    '-300': 'Central Daylight Time',
    '-240': 'Cuba Daylight Time',
  },
  CEDT: 'Central European Daylight Time',
  CEST: 'Central European Summer Time',
  CET: 'Central European Time',
  CHADT: 'Chatham Daylight Time',
  CHAST: 'Chatham Standard Time',
  CHOT: 'Choibalsan',
  ChST: 'Chamorro Standard Time',
  CHUT: 'Chuuk Time',
  CIST: 'Clipperton Island Standard Time',
  CIT: 'Central Indonesia Time',
  CKT: 'Cook Island Time',
  CLST: 'Chile Summer Time',
  CLT: 'Chile Standard Time',
  COST: 'Colombia Summer Time',
  COT: 'Colombia Time',
  CST: {
    '-360': 'Central Standard Time',
    '480': 'China Standard Time',
    '570': 'Central Standard Time',
    '630': 'Central Summer Time',
    '-300': 'Cuba Standard Time',
  },
  CT: 'China time',
  CVT: 'Cape Verde Time',
  CWST: 'Central Western Standard Time',
  CXT: 'Christmas Island Time',
  DAVT: 'Davis Time',
  DDUT: "Dumont d'Urville Time",
  DFT: 'AIX specific equivalent of Central European Time',
  EASST: 'Easter Island Standard Summer Time',
  EAST: 'Easter Island Standard Time',
  EAT: 'East Africa Time',
  ECT: {
    '-240': 'Eastern Caribbean Time',
    '-300': 'Ecuador Time',
  },
  EDT: 'Eastern Daylight Time',
  EEDT: 'Eastern European Daylight Time',
  EEST: 'Eastern European Summer Time',
  EET: 'Eastern European Time',
  EGST: 'Eastern Greenland Summer Time',
  EGT: 'Eastern Greenland Time',
  EIT: 'Eastern Indonesian Time',
  EST: 'Eastern Standard Time',
  FET: 'Further-Eastern European Time',
  FJT: 'Fiji Time',
  FKST: 'Falkland Islands Standard Time',
  FKT: 'Falkland Islands Time',
  FNT: 'Fernando de Noronha Time',
  GALT: 'Galapagos Time',
  GAMT: 'Gambier Islands',
  GET: 'Georgia Standard Time',
  GFT: 'French Guiana Time',
  GILT: 'Gilbert Island Time',
  GIT: 'Gambier Island Time',
  GMT: 'Greenwich Mean Time',
  GST: {
    '-120': 'South Georgia and the South Sandwich Islands',
    '240': 'Gulf Standard Time',
  },
  GYT: 'Guyana Time',
  HADT: 'HawaiiAleutian Daylight Time',
  HAEC: "Heure Avancee d'Europe Centrale francised name for CEST",
  HAST: 'HawaiiAleutian Standard Time',
  HKT: 'Hong Kong Time',
  HMT: 'Heard and McDonald Islands Time',
  HOVT: 'Khovd Time',
  HST: 'Hawaii Standard Time',
  IBST: 'International Business Standard Time',
  ICT: 'Indochina Time',
  IDT: 'Israel Daylight Time',
  IOT: 'Indian Ocean Time',
  IRDT: 'Iran Daylight Time',
  IRKT: 'Irkutsk Time',
  IRST: 'Iran Standard Time',
  IST: {
    '330': 'Indian Standard Time',
    '60': 'Irish Standard Time',
    '120': 'Israel Standard Time',
  },
  JST: 'Japan Standard Time',
  KGT: 'Kyrgyzstan time',
  KOST: 'Kosrae Time',
  KRAT: 'Krasnoyarsk Time',
  KST: 'Korea Standard Time',
  LHST: {
    '630': 'Lord Howe Standard Time',
    '660': 'Lord Howe Summer Time',
  },
  LINT: 'Line Islands Time',
  MAGT: 'Magadan Time',
  MART: 'Marquesas Islands Time',
  MAWT: 'Mawson Station Time',
  MDT: 'Mountain Daylight Time',
  MET: 'Middle European Time Same zone as CET',
  MEST: 'Middle European Summer Time Same zone as CEST',
  MHT: 'Marshall Islands',
  MIST: 'Macquarie Island Station Time',
  MIT: 'Marquesas Islands Time',
  MMT: 'Myanmar Time',
  MSK: 'Moscow Time',
  MST: {
    '480': 'Malaysia Standard Time',
    '-420': 'Mountain Standard Time',
    '390': 'Myanmar Standard Time',
  },
  MUT: 'Mauritius Time',
  MVT: 'Maldives Time',
  MYT: 'Malaysia Time',
  NCT: 'New Caledonia Time',
  NDT: 'Newfoundland Daylight Time',
  NFT: 'Norfolk Time',
  NPT: 'Nepal Time',
  NST: 'Newfoundland Standard Time',
  NT: 'Newfoundland Time',
  NUT: 'Niue Time',
  NZDT: 'New Zealand Daylight Time',
  NZST: 'New Zealand Standard Time',
  OMST: 'Omsk Time',
  ORAT: 'Oral Time',
  PDT: 'Pacific Daylight Time',
  PET: 'Peru Time',
  PETT: 'Kamchatka Time',
  PGT: 'Papua New Guinea Time',
  PHOT: 'Phoenix Island Time',
  PKT: 'Pakistan Standard Time',
  PMDT: 'Saint Pierre and Miquelon Daylight Time',
  PMST: 'Saint Pierre and Miquelon Standard Time',
  PONT: 'Pohnpei Standard Time',
  PST: {
    '-480': 'Pacific Standard Time',
    '480': 'Philippine Standard Time',
  },
  PYST: 'Paraguay Summer Time',
  PYT: 'Paraguay Time',
  RET: 'Reunion Time',
  ROTT: 'Rothera Research Station Time',
  SAKT: 'Sakhalin Island time',
  SAMT: 'Samara Time',
  SAST: 'South African Standard Time',
  SBT: 'Solomon Islands Time',
  SCT: 'Seychelles Time',
  SGT: 'Singapore Time',
  SLST: 'Sri Lanka Standard Time',
  SRET: 'Srednekolymsk Time',
  SRT: 'Suriname Time',
  SST: {
    '-660': 'Samoa Standard Time',
    '480': 'Singapore Standard Time',
  },
  SYOT: 'Showa Station Time',
  TAHT: 'Tahiti Time',
  THA: 'Thailand Standard Time',
  TFT: 'Indian/Kerguelen',
  TJT: 'Tajikistan Time',
  TKT: 'Tokelau Time',
  TLT: 'Timor Leste Time',
  TMT: 'Turkmenistan Time',
  TOT: 'Tonga Time',
  TVT: 'Tuvalu Time',
  UCT: 'Coordinated Universal Time',
  ULAT: 'Ulaanbaatar Time',
  USZ1: 'Kaliningrad Time',
  UTC: 'Coordinated Universal Time',
  UYST: 'Uruguay Summer Time',
  UYT: 'Uruguay Standard Time',
  UZT: 'Uzbekistan Time',
  VET: 'Venezuelan Standard Time',
  VLAT: 'Vladivostok Time',
  VOLT: 'Volgograd Time',
  VOST: 'Vostok Station Time',
  VUT: 'Vanuatu Time',
  WAKT: 'Wake Island Time',
  WAST: 'West Africa Summer Time',
  WAT: 'West Africa Time',
  WEDT: 'Western European Daylight Time',
  WEST: 'Western European Summer Time',
  WET: 'Western European Time',
  WIT: 'Western Indonesian Time',
  WST: 'Western Standard Time',
  YAKT: 'Yakutsk Time',
  YEKT: 'Yekaterinburg Time',
  Z: 'Zulu Time',
}

export const formatFeedTime = (timestamp: number, i18next: i18nType) => {
  return quickFormat(timestamp, i18next, 'h:mm a')
}

export const formatFeedDate = (timestamp: number, i18next: i18nType) => {
  return quickFormat(timestamp, i18next, 'MMM d')
}

export const getDatetimeDisplayString = (
  timestamp: number,
  t: TranslationFunction,
  i18next: i18nType
) => {
  const timeFormatted = formatFeedTime(timestamp, i18next)
  const dateFormatted = formatFeedDate(timestamp, i18next)
  return `${dateFormatted} ${t('at')} ${timeFormatted}`
}

export const getRemoteTime = () => {
  return clock.getTime()
}

const DRIFT_THRESHOLD_IN_MS = 1000 * 4 // 4 seconds - Clique future block allowed time is 5 seconds

export const clockInSync = async () => {
  const localTime = Date.now()
  const syncTime = getRemoteTime()
  const drift = localTime - syncTime // in milliseconds
  Logger.info(
    `clockInSync`,
    `Local time: ${new Date(localTime).toLocaleString()} ` +
      `Remote time: ${new Date(syncTime).toLocaleString()} ` +
      `drift: ${drift} milliseconds`
  )
  return Math.abs(drift) < DRIFT_THRESHOLD_IN_MS
}

export const getLocalTimezone = () => {
  // Reference: https://momentjs.com/timezone/docs/#/using-timezones/formatting/
  const timezoneGuess = momentTimezone.tz(momentTimezone.tz.guess())
  momentTimezone.fn.zoneName = function() {
    const abbr = this.zoneAbbr()
    if (!i18n.language.includes('en')) {
      return abbr
    }
    return (
      (_.isObject(TIMEZONE_MAPPING[abbr])
        ? TIMEZONE_MAPPING[abbr][timezoneGuess._offset]
        : TIMEZONE_MAPPING[abbr]) || abbr
    )
  }
  return timezoneGuess.format('zz')
}

export const timeDeltaInDays = (currTime: number, prevTime: number) => {
  return (1.0 * (currTime - prevTime)) / 1000 / 60 / 60 / 24
}

export const timeDeltaInSeconds = (currTime: number, prevTime: number) => {
  return (1.0 * (currTime - prevTime)) / 1000
}

function quickFormat(timestamp: number, i18next: i18nType, formatRule: string) {
  // some timestamps are in seconds, some are in miliseconds
  // assume dates will be within a few decades of now and multiple accordingly
  const millisecondsSinceEpoch =
    Math.abs(differenceInYears(timestamp, Date.now())) > 40 ? timestamp * 1000 : timestamp

  return format(millisecondsSinceEpoch, formatRule, {
    locale: i18next.language.includes('es') ? es : enUS,
  })
}
