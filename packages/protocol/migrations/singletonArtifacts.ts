export class ArtifactsSingleton {
  public static getInstance(namespace: string): ArtifactsSingleton {
    if (!(namespace in ArtifactsSingleton.instances)) {
      ArtifactsSingleton.instances[namespace] = new ArtifactsSingleton()
    }

    return ArtifactsSingleton.instances[namespace]
  }

  private static instances: { [key: string]: ArtifactsSingleton } = {}

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
