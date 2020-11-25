import 'react-native'

let i18n
let enLoaded = false
let esLoaded = false
let ptLoaded = false

describe('i18n', () => {
  beforeEach(() => {
    enLoaded = false
    esLoaded = false
    ptLoaded = false
    // i18nInstance

    jest.resetModules()

    jest.mock('../locales/en-US', () => {
      enLoaded = true
      return { default: { global: { someKey: 'Hi!' } } }
    })

    jest.mock('../locales/es-419', () => {
      esLoaded = true
      return { default: { global: { someKey: '¡Hola!' } } }
    })

    jest.mock('../locales/pt-BR', () => {
      ptLoaded = true
      return { default: { global: { someKey: 'Oi!' } } }
    })

    jest.unmock('src/i18n')
    i18n = require('src/i18n').default
  })

  it('only loads the default language (en-US)', () => {
    expect(i18n.t('global:someKey')).toEqual('Hi!')
    expect(enLoaded).toBe(true)
    expect(esLoaded).toBe(false)
    expect(ptLoaded).toBe(false)
  })

  it('only loads the selected language, but loads the default language when accessing a missing key', () => {
    i18n.changeLanguage('es-419')
    expect(i18n.t('global:someKey')).toEqual('¡Hola!')
    expect(enLoaded).toBe(false)
    expect(esLoaded).toBe(true)
    expect(ptLoaded).toBe(false)

    // This will cause the default (fallback) language to be loaded
    expect(i18n.t('global:someMissingKey')).toEqual('someMissingKey')
    expect(enLoaded).toBe(true)
    expect(esLoaded).toBe(true)
    expect(ptLoaded).toBe(false)
  })
})
