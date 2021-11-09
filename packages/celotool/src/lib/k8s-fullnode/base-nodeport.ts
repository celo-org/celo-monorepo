import { range } from 'lodash'
import { getAllUsedNodePorts, getService } from '../kubernetes'
import { BaseFullNodeDeployer, BaseFullNodeDeploymentConfig } from './base'

const NODE_PORT_MIN = 30000
const NODE_PORT_MAX = 32767

export abstract class BaseNodePortFullNodeDeployer extends BaseFullNodeDeployer {
  async additionalHelmParameters() {
    const existingNodePortSet = await this.getExistingNodePortSet()
    const newNodePortForEachFullNode = await this.getNodePortForEachFullNode()
    const newNodePortSet = new Set(newNodePortForEachFullNode)
    // Essentially existingNodePortSet - newNodePortForEachFullNode
    const nodePortsToRemove = new Set(
      Array.from(existingNodePortSet).filter((existing) => !newNodePortSet.has(existing))
    )
    // Ensure all the new node ports have ingress rules set
    await this.setIngressRulesTCPAndUDP(newNodePortForEachFullNode, true)
    // Remove any removed node port ingress rules
    await this.setIngressRulesTCPAndUDP(Array.from(nodePortsToRemove), false)

    const nodePortPerFullNodeStrs = newNodePortForEachFullNode.map(
      (nodePort: number, index: number) =>
        `--set geth.service_node_port_per_full_node[${index}]=${nodePort}`
    )
    return [...nodePortPerFullNodeStrs, `--set geth.service_type=NodePort`]
  }

  async getNodePortForEachFullNode() {
    // Get all node ports that are currently used on the entire cluster
    const allUsedNodePorts: number[] = await getAllUsedNodePorts()
    // Get the service for each full node. An element will be undefined if does not exist
    const serviceForEachFullNode: any[] = await this.getServiceForEachFullNode()

    const NO_NODE_PORT = -1
    // Get the node port for each existing full node service. If none has been
    // assigned, give `NO_KNOWN_NODE_PORT`
    const nodePortForEachFullNode: number[] = serviceForEachFullNode.map((service: any) => {
      if (!service) {
        return NO_NODE_PORT
      }
      return service.spec.ports.reduce((existingNodePort: number, portsSpec: any) => {
        if (!portsSpec.nodePort) {
          return existingNodePort
        }
        if (existingNodePort !== NO_NODE_PORT && existingNodePort !== portsSpec.nodePort) {
          throw Error(
            `Expected all nodePorts to be the same in service, got ${existingNodePort} !== ${portsSpec.nodePort}`
          )
        }
        return portsSpec.nodePort
      }, NO_NODE_PORT)
    })

    let potentialPort = NODE_PORT_MIN
    let allUsedNodePortsIndex = 0
    // Assign node port to services that do not have one yet. Do so in a way to
    // not assign a node port that has been assigned to another service on the
    // cluster, and keep newly assigned node ports as close to the minPort as
    // possible. Doing so makes reasoning about node ports and port ranges way easier.
    for (let i = 0; i < nodePortForEachFullNode.length; i++) {
      const nodePort = nodePortForEachFullNode[i]
      if (nodePort === NO_NODE_PORT) {
        for (; allUsedNodePortsIndex < allUsedNodePorts.length; allUsedNodePortsIndex++) {
          if (potentialPort > NODE_PORT_MAX) {
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
    return nodePortForEachFullNode
  }

  /**
   * Not needed for NodePort services. Instead, shows a message to remove any
   * now-unused ports from the security group whitelist
   */
  async deallocateAllIPs() {
    // Do nothing
  }

  /**
   * Returns an array with each element as the corresponding full node's service.
   * An element will be undefined if the service doesn't exist.
   */
  getServiceForEachFullNode() {
    const replicas = this.deploymentConfig.replicas
    return Promise.all(
      range(replicas).map(async (i: number) =>
        getService(`${this.celoEnv}-fullnodes-${i}`, this.kubeNamespace)
      )
    )
  }

  /**
   * Returns an array of all services that currently exist for full nodes.
   * Does so using a selector, and has no guarantees about the order of the services.
   */
  async getExistingFullNodeServices() {
    const response = await getService(
      `--selector=component=celo-fullnode-protocol-traffic`,
      this.kubeNamespace
    )
    return response.items
  }

  /**
   * Looks at the existing full node services and returns which nodePorts are currently used.
   */
  async getExistingNodePortSet(): Promise<Set<number>> {
    const serviceForEachFullNode = await this.getExistingFullNodeServices()
    return serviceForEachFullNode.reduce((set: Set<number>, service: any) => {
      // If there is no service for a full node, it is undefined. Just ignore
      if (!service) {
        return set
      }
      for (const portSpec of service.spec.ports) {
        if (portSpec.nodePort) {
          set.add(portSpec.nodePort)
        }
      }
      return set
    }, new Set<number>())
  }

  async getFullNodeIP(_index: number): Promise<string> {
    throw Error('Not supported for NodePort full nodes')
  }

  /**
   * Determines if a given port number is a valid node port.
   */
  isNodePort(portNumber: number): boolean {
    return portNumber >= NODE_PORT_MIN && portNumber <= NODE_PORT_MAX
  }

  abstract setIngressRulesTCPAndUDP(nodePorts: number[], authorize: boolean): Promise<void>

  get deploymentConfig(): BaseFullNodeDeploymentConfig {
    return this._deploymentConfig
  }
}
