import { ContractPackage } from '../contractPackages'

// This objects replicates a Truffle `artifacts.require` singleton
// but constructed manually
export class ArtifactsSingleton {
  public static getInstance(contractPackage: ContractPackage, defaultArtifacts?: any): any {
    if (contractPackage === undefined || contractPackage.path === undefined) {
      return defaultArtifacts
    }

    const namespace = contractPackage.path
    if (!(namespace in ArtifactsSingleton.instances)) {
      ArtifactsSingleton.instances[namespace] = new ArtifactsSingleton()
    }

    return ArtifactsSingleton.instances[namespace]
  }

  private static instances: { [key: string]: ArtifactsSingleton } = {}

  public artifacts: { [key: string]: any } = {}

  private static network: any

  public static setNetwork(network: any) {
    this.network = network
  }

  public static getNetwork() {
    return this.network
  }

  private constructor() {}

  public addArtifact(key: string, value: any) {
    this.artifacts[key] = value
  }

  public require(key: string) {
    return this.artifacts[key]
  }
}
