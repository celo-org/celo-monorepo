export class MySingleton {
  public static getInstance(): MySingleton {
    if (!MySingleton.instance) {
      MySingleton.instance = new MySingleton()
    }

    return MySingleton.instance
  }

  private static instance: MySingleton

  public initialized = false
  public artifacts: { [key: string]: any } = {}
  private constructor() {}

  public addArtifact(key: string, value: any) {
    this.artifacts[key] = value
  }

  public require(key: string) {
    return this.artifacts[key]
  }
}
