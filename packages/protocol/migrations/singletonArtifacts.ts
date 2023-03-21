export class MySingleton {
  public static getInstance(namespace: string): MySingleton {
    if (!(namespace in MySingleton.instances)) {
      MySingleton.instances[namespace] = new MySingleton()
    }

    return MySingleton.instances[namespace]
  }

  private static instances: { [key: string]: MySingleton } = {}

  public initialized = false
  public artifacts: { [key: string]: any } = {}
  private constructor() {}

  public addArtifact(key: string, value: any) {
    // console.log("Adding artifact", key, value)
    // TODO namespace in this.artifacts, this.artifacts[namespace] = {}
    this.artifacts[key] = value
  }

  public require(key: string) {
    // console.log("keys are", Object.keys( this.artifacts))
    return this.artifacts[key]
  }
}
