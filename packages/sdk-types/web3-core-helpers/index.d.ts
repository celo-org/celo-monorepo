import 'web3-core-helpers'

declare module 'web3-core-helpers' {
  export type Callback<T> = (error: Error | null, result?: T) => void
  // this shows us how we are using it, but there is no way of overriding the type of an attribute
  export type JsonRpcResp = JsonRpcResponse & {
    error?: { message: string; code: number }
  }
}
