if (typeof window !== 'object') {
  // @ts-ignore
  global.window = global
  // @ts-ignore
  global.window.navigator = {}
}
