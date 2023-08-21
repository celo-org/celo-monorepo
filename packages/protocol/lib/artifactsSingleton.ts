import { ContractPackage } from '../contractPackages'

// This objects replicates a Truffle `artifacts.require` singleton
// but constructed manually


// This class is meant to be used to wrap truffle artifacts
// and extend its interface
// TODO: create abstract class with require and getProxy
export class DefaultArtifact{
  public artifacts: any

  public constructor(artifacts) {
    this.artifacts = artifacts
  }

  // TODO abstract this function
  public require(key: string) {
    return this.artifacts.require(key)
  }

  public getProxy(key: string) {
    const proxyArtifactName = key + "Proxy"
    console.log("getProxy", proxyArtifactName)
    return this.require(proxyArtifactName)
  }
  
}

export class ArtifactsSingleton {
  public static setNetwork(network: any) {
    this.network = network
  }

  public static getNetwork() {
    return this.network
  }

  public static getInstance(contractPackage: ContractPackage, defaultArtifacts?: any): any {
    console.log("getInstance", contractPackage)
    if (contractPackage === undefined || contractPackage.path === undefined) {
      // default artifacts but overcharged with a getProxy method
      const artifacts = new DefaultArtifact(defaultArtifacts)
      return artifacts
    }

    const namespace = contractPackage.path
    if (!(namespace in ArtifactsSingleton.instances)) {
      ArtifactsSingleton.instances[namespace] = new ArtifactsSingleton()
    }

    // console.log("artifacts for that instance are", ArtifactsSingleton.instances[namespace])
    return ArtifactsSingleton.instances[namespace]
  }

  public static wrap(artifacts:any){
    if (artifacts instanceof ArtifactsSingleton || artifacts instanceof DefaultArtifact){
      console.log("Using our wrap")
      return artifacts
    }

    console.log("Using default")
    return new DefaultArtifact(artifacts)
  }

  private static instances: { [key: string]: ArtifactsSingleton } = {}

  private static network: any

  public artifacts: { [key: string]: any } = {}

  private constructor() {}

  public addArtifact(key: string, value: any) {
    this.artifacts[key] = value
  }


  public require(key: string) {
    return this.artifacts[key]
  }

  //
  public getProxy(key: string, defaultArtifacts?:any) {
    // TODO proxyArtifactName logic is duplicated in two classes
    const proxyArtifactName = key + "Proxy"

      const toReturn = this.require(proxyArtifactName)

      if (toReturn === undefined){
        console.log("using default getProxy")
        return defaultArtifacts.require(proxyArtifactName)
      }

    console.log("using ours getProxy")
    return toReturn
  }
}
