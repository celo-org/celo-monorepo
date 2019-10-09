export function fetchEnv(name: string): string {
  if (process.env[name] === undefined) {
    console.error(`ENV var '${name}' was not defined`)
    throw new Error(`ENV var '${name}' was not defined`)
  }
  return process.env[name] as string
}
