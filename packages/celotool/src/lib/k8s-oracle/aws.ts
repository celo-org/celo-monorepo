import { BaseOracleDeployer, BaseOracleDeploymentConfig } from "./base";

export interface AWSOracleDeploymentConfig extends BaseOracleDeploymentConfig {
}

export class AWSOracleDeployer extends BaseOracleDeployer {
  // async helmParameters() {
  //   return [
  //     ...await super.helmParameters(),
  //     // `--set `
  //   ]
  // }
}
