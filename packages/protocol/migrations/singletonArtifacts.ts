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
    this.artifacts[key] = value
  }

  public require(key: string) {
    return this.artifacts[key]
  }
}
