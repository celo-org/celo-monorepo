/// <reference types="next" />
/// <reference types="next/types/global" />

import { CSSProp } from '@emotion/core'

declare module 'react' {
  interface Attributes {
    css?: CSSProp
  }
}
