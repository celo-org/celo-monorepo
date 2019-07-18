import i18next from 'i18next'
import 'next-i18next'
import { LinkProps } from 'next-server/link'
import { SingletonRouter } from 'next-server/router'
import * as React from 'react'
import {
  Namespace,
  NamespaceExtractor,
  Subtract,
  TransProps,
  WithNamespacesOptions,
} from 'react-i18next'

declare module 'next-i18next' {
  export type InitConfig = {
    browserLanguageDetection?: boolean
    serverLanguageDetection?: boolean
    strictMode?: boolean
    defaultLanguage?: string
    ignoreRoutes?: string[]
    localePath?: string
    localeStructure?: string
    otherLanguages?: string[]
    localeSubpaths?: 'none' | 'foreign' | 'all'
    use?: any[]
    customDetectors?: any[]
  } & i18next.InitOptions

  export interface I18nProps {
    t(key: string, option?: object): string
    i18n: i18next
  }

  declare class NextI18Next {
    Trans: React.ComponentClass<TransProps>
    Link: React.ComponentClass<LinkProps>
    Router: SingletonRouter
    i18n: i18next.i18n

    constructor(config: InitConfig)

    withNamespaces(
      namespace: Namespace | NamespaceExtractor,
      options?: WithNamespacesOptions
    ): <T extends React.ComponentType<any>>(
      component: T
    ) => T extends React.ComponentType<infer P>
      ? React.ComponentType<Subtract<P, I18nProps>>
      : never

    appWithTranslation<P extends object>(
      Component: React.ComponentType<P> | React.ElementType<P>
    ): any
  }

  export default NextI18Next
}
