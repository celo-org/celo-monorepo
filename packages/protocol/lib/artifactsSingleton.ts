import { ContractPackage } from '../contractPackages';

// Defines a minimal interface an artifact should implement
export interface ArtifactSet {
  require(key: string): any;
  getProxy(key: string): any;
}

function getProxyName(contractName:string){
  return contractName + "Proxy";
}

// This class is meant to be used to wrap truffle artifacts
// and extend its interface.
// ArtifactsSingleton.wrap returns an instance of DefaultArtifact
export class DefaultArtifact implements ArtifactSet{
  public artifacts: any
  
  public constructor(artifacts) {
    this.artifacts = artifacts
  }
  
  public require(key: string) {
    return this.artifacts.require(key)
  }
  
  public getProxy(key: string) {
    return this.require(getProxyName(key))
  }
  
}

// This objects replicates a Truffle `artifacts.require` singleton
// but constructed manually
export class ArtifactsSingleton implements ArtifactSet{
  public static setNetwork(network: any) {
    this.network = network
  }

  public static getNetwork() {
    return this.network
  }

  public static getInstance(contractPackage: ContractPackage, defaultArtifacts?: any): any {
    if (contractPackage === undefined || contractPackage.path === undefined) {
      // default artifacts but overcharged with a getProxy method
      const artifacts = new DefaultArtifact(defaultArtifacts)
      return artifacts
    }

    const namespace = contractPackage.path
    if (!(namespace in ArtifactsSingleton.instances)) {
      ArtifactsSingleton.instances[namespace] = new ArtifactsSingleton()
    }

    return ArtifactsSingleton.instances[namespace]
  }

  public static wrap(artifacts:any){
    if (artifacts instanceof ArtifactsSingleton || artifacts instanceof DefaultArtifact){
      return artifacts
    }

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

  public getProxy(key: string, defaultArtifacts?:any) {
    const proxyArtifactName = getProxyName(key)

    const toReturn = this.require(proxyArtifactName)

    if (toReturn === undefined){
      // in case the package of this artifact has proxiesPath set
      // this needs to be changed to support it, now only "/" path is supported
      return defaultArtifacts?.require(proxyArtifactName)
    }

    return toReturn
  }
}
