import hoistStatics from 'hoist-non-react-statics'
import { withTranslation as withTranslationI18Next } from 'react-i18next'

export default {
  language: 'EN',
  t: (key: string) => key,
  changeLanguage: () => {},
}

export enum Namespaces {}

export const withTranslation = (namespace: any) => (component: React.ComponentType<any>) =>
  hoistStatics(withTranslationI18Next(namespace)(component), component)
