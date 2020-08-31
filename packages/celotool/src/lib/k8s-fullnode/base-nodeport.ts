import { range } from 'lodash'
import { getAllUsedNodePorts, getService } from '../kubernetes'
import { BaseFullNodeDeployer, BaseFullNodeDeploymentConfig } from './base'

export abstract class BaseNodePortFullNodeDeployer extends BaseFullNodeDeployer {

  async additionalHelmParameters() {
    const nodePortForEachFullNode = await this.getNodePortForEachFullNode()
    const nodePortPerFullNodeStrs = nodePortForEachFullNode.map((nodePort: number, index: number) =>
      `--set geth.service_node_port_per_full_node[${index}]=${nodePort}`
    )
    return [
      ...nodePortPerFullNodeStrs,
      `--set geth.service_type=NodePort`,
    ]
  }

  async getNodePortForEachFullNode() {
    // Get all node ports that are currently used on the entire cluster
    const allUsedNodePorts: number[] = await getAllUsedNodePorts()
    console.log('allUsedNodePorts start', allUsedNodePorts)
    // Get the service for each full node. An element will be undefined if does not exist
    const serviceForEachFullNode: any[] = await this.getServiceForEachFullNode()

    const NO_KNOWN_NODE_PORT = -1
    // Get the node port for each existing full node service. If none has been
    // assigned, give `NO_KNOWN_NODE_PORT`
    const nodePortForEachFullNode: number[] = serviceForEachFullNode.map((service: any) => {
      if (!service) {
        return NO_KNOWN_NODE_PORT
      }
      return service.spec.ports.reduce((existingNodePort: number, portsSpec: any) => {
        if (!portsSpec.nodePort) {
          return existingNodePort
        }
        if (existingNodePort !== NO_KNOWN_NODE_PORT && existingNodePort !== portsSpec.nodePort) {
          throw Error(`Expected all nodePorts to be the same in service, got ${existingNodePort} !== ${portsSpec.nodePort}`)
        }
        return portsSpec.nodePort
      }, NO_KNOWN_NODE_PORT)
    })

    const minPort = 30000
    const maxPort = 32767
    let potentialPort = minPort
    let allUsedNodePortsIndex = 0
    // Assign node port to services that do not have one yet. Do so in a way to
    // not assign a node port that has been assigned to another service on the
    // cluster, and keep newly assigned node ports as close to the minPort as
    // possible. Doing so makes reasoning about node ports and port ranges way easier.
    for (let i = 0; i < nodePortForEachFullNode.length; i++) {
      const nodePort = nodePortForEachFullNode[i]
      if (nodePort === NO_KNOWN_NODE_PORT) {
        for (; allUsedNodePortsIndex < allUsedNodePorts.length; allUsedNodePortsIndex++) {
          if (potentialPort > maxPort) {
            throw Error(`No available node ports`)
          }
          const usedPort = allUsedNodePorts[allUsedNodePortsIndex]
          if (potentialPort < usedPort) {
            break
          }
          // Try the next port on the next iteration
          potentialPort = usedPort + 1
        }
        // Assign the port
        nodePortForEachFullNode[i] = potentialPort
        // Add the newly assigned port to allUsedNodePorts
        allUsedNodePorts.splice(allUsedNodePortsIndex, 0, potentialPort)
        // Increment potential port for a potential subsequent NodePort assignment
        potentialPort++
      }
    }
    this.printNodePortsToAllow(allUsedNodePorts)
    return nodePortForEachFullNode
  }

  /**
   * Not needed for NodePort services. Instead, shows a message to remove any
   * now-unused ports from the security group whitelist
   */
  async deallocateAllIPs() {
    const allUsedNodePorts: number[] = await getAllUsedNodePorts()
    this.printNodePortsToAllow(allUsedNodePorts)
  }

  getServiceForEachFullNode() {
    const replicas = this.deploymentConfig.replicas
    return Promise.all(
      range(replicas).map(async (i: number) =>
        getService(`${this.celoEnv}-fullnodes-${i}`, this.kubeNamespace)
      )
    )
  }

  abstract printNodePortsToAllow(nodePorts: number[]): void

  get deploymentConfig(): BaseFullNodeDeploymentConfig {
    return this._deploymentConfig
  }
}
