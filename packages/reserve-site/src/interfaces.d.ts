declare module '*.json' {
  const value: any
  export default value
}

declare module '*.md' {
  const value: string
  export default value
}

declare module '*.png' {
  const value: any
  export default value
}

declare module '*.jpg' {
  const value: any
  export default value
}

declare module '*.gif' {
  const value: any
  export default value
}

declare module '*.webp' {
  const value: any
  export default value
}

declare module '*.scss' {
  const value: any
  export default value
}

declare namespace NodeJS {
  interface Process {
    browser: boolean
  }
}
