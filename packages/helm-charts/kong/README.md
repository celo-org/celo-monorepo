# Kong

[Kong](https://konghq.com/kong/) is a scalable, open source API layer (aka API gateway or API middleware) that runs in front of any RESTful API. Extra functionalities beyond the core platform are extended through plugins. Kong is built on top of reliable technologies like NGINX and provides an easy-to-use RESTful API to operate and configure the system.

## TL;DR

```console
  helm repo add bitnami https://charts.bitnami.com/bitnami
  helm install my-release bitnami/kong
```

## Introduction

This chart bootstraps a [kong](https://github.com/bitnami/bitnami-docker-kong) deployment on a [Kubernetes](http://kubernetes.io) cluster using the [Helm](https://helm.sh) package manager. It also includes the [kong-ingress-controller](https://github.com/bitnami/bitnami-docker-kong-ingress-controller) container for managing Ingress resources using Kong.

Bitnami charts can be used with [Kubeapps](https://kubeapps.com/) for deployment and management of Helm Charts in clusters.

## Prerequisites

- Kubernetes 1.12+
- Helm 3.1.0
- PV provisioner support in the underlying infrastructure

## Installing the Chart

To install the chart with the release name `my-release`:

```console
  helm repo add bitnami https://charts.bitnami.com/bitnami
  helm install my-release bitnami/kong
```

These commands deploy kong on the Kubernetes cluster in the default configuration. The [Parameters](#parameters) section lists the parameters that can be configured during installation.

> **Tip**: List all releases using `helm list`

## Uninstalling the Chart

To uninstall/delete the `my-release` deployment:

```console
  helm delete my-release
```

## Parameters

The following tables list the configurable parameters of the kong chart and their default values per section/component:

### Global Parameters

| Parameter                 | Description                                     | Default                                                 |
|---------------------------|-------------------------------------------------|---------------------------------------------------------|
| `global.imageRegistry`    | Global Docker image registry                    | `nil`                                                   |
| `global.imagePullSecrets` | Global Docker registry secret names as an array | `[]` (does not add image pull secrets to deployed pods) |
| `global.storageClass`     | Global storage class for dynamic provisioning   | `nil`                                                   |

### Common Parameters

| Parameter           | Description                                                                                       | Default         |
|---------------------|---------------------------------------------------------------------------------------------------|-----------------|
| `nameOverride`      | String to partially override kong.fullname template with a string (will prepend the release name) | `nil`           |
| `fullnameOverride`  | String to fully override kong.fullname template with a string                                     | `nil`           |
| `commonLabels`      | Labels to add to all deployed objects                                                             | `nil`           |
| `commonAnnotations` | Annotations to add to all deployed objects                                                        | `[]`            |
| `clusterDomain`     | Kubernetes cluster domain                                                                         | `cluster.local` |
| `kubeVersion`       | Force target Kubernetes version (using Helm capabilities if not set)                              | `nil`           |

### Deployment Parameters

| Parameter                                | Description                                                                                                                                   | Default                                                 |
|------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------|
| `image.registry`                         | kong image registry                                                                                                                           | `docker.io`                                             |
| `image.repository`                       | kong image name                                                                                                                               | `bitnami/kong`                                          |
| `image.tag`                              | kong image tag                                                                                                                                | `{TAG_NAME}`                                            |
| `image.pullPolicy`                       | kong image pull policy                                                                                                                        | `IfNotPresent`                                          |
| `image.pullSecrets`                      | Specify docker-registry secret names as an array                                                                                              | `[]` (does not add image pull secrets to deployed pods) |
| `useDaemonset`                           | Use a daemonset instead of a deployment. `replicaCount` will not take effect.                                                                 | `false`                                                 |
| `replicaCount`                           | Number of replicas of the kong Pod                                                                                                            | `2`                                                     |
| `updateStrategy`                         | Update strategy for deployment                                                                                                                | `{type: "RollingUpdate"}`                               |
| `schedulerName`                          | Alternative scheduler                                                                                                                         | `nil`                                                   |
| `database`                               | Select which database backend Kong will use. Can be 'postgresql' or 'cassandra'                                                               | `postgresql`                                            |
| `containerSecurityContext`               | Container security podSecurityContext                                                                                                         | `{ runAsUser: 1001, runAsNonRoot: true}`                |
| `podSecurityContext`                     | Pod security context                                                                                                                          | `{}`                                                    |
| `hostAliases`                            | Add deployment host aliases                                                                                                                   | `[]`                                                    |
| `nodeSelector`                           | Node labels for pod assignment                                                                                                                | `{}`                                                    |
| `tolerations`                            | Tolerations for pod assignment                                                                                                                | `[]`                                                    |
| `affinity`                               | Affinity for pod assignment                                                                                                                   | `{}`                                                    |
| `podAffinityPreset`                      | Pod affinity preset. Ignored if `affinity` is set. Allowed values: `soft` or `hard`                                                           | `""`                                                    |
| `podAntiAffinityPreset`                  | Pod anti-affinity preset. Ignored if `affinity` is set. Allowed values: `soft` or `hard`                                                      | `soft`                                                  |
| `nodeAffinityPreset.type`                | Node affinity preset type. Ignored if `affinity` is set. Allowed values: `soft` or `hard`                                                     | `""`                                                    |
| `nodeAffinityPreset.key`                 | Node label key to match Ignored if `affinity` is set.                                                                                         | `""`                                                    |
| `nodeAffinityPreset.values`              | Node label values to match. Ignored if `affinity` is set.                                                                                     | `[]`                                                    |
| `podAnnotations`                         | Pod annotations                                                                                                                               | `{}`                                                    |
| `podLabels`                              | Pod labels                                                                                                                                    | `{}`                                                    |
| `sidecars`                               | Attach additional containers to the pod (evaluated as a template)                                                                             | `nil`                                                   |
| `initContainers`                         | Add additional init containers to the pod (evaluated as a template)                                                                           | `nil`                                                   |
| `pdb.enabled`                            | Deploy a pdb object for the Kong pod                                                                                                          | `false`                                                 |
| `pdb.maxUnavailable`                     | Maximum unavailable Kong replicas (expressed in percentage)                                                                                   | `50%`                                                   |
| `autoscaling.enabled`                    | Deploy a HorizontalPodAutoscaler object for the Kong deployment                                                                               | `false`                                                 |
| `autoscaling.apiVersion`                 | API Version of the HPA object (for compatibility with Openshift)                                                                              | `v1beta1`                                               |
| `autoscaling.minReplicas`                | Minimum number of replicas to scale back                                                                                                      | `2`                                                     |
| `autoscaling.maxReplicas`                | Maximum number of replicas to scale out                                                                                                       | `2`                                                     |
| `autoscaling.metrics`                    | Metrics to use when deciding to scale the deployment (evaluated as a template)                                                                | `Check values.yaml`                                     |
| `extraVolumes`                           | Array of extra volumes to be added to the Kong deployment deployment (evaluated as template). Requires setting `extraVolumeMounts`            | `nil`                                                   |
| `kong.livenessProbe`                     | Liveness probe  (kong container)                                                                                                              | `Check values.yaml`                                     |
| `kong.readinessProbe`                    | Readiness probe (kong container)                                                                                                              | `Check values.yaml`                                     |
| `kong.lifecycleHooks`                    | Lifecycle hooks (kong container)                                                                                                              | `Check deployment.yaml`                                 |
| `kong.customLivenessProbe`               | Override default liveness probe (kong container)                                                                                              | `nil`                                                   |
| `kong.customReadinessProbe`              | Override default readiness probe (kong container)                                                                                             | `nil`                                                   |
| `kong.resources`                         | Configure resource requests and limits (kong container)                                                                                       | `nil`                                                   |
| `kong.extraVolumeMounts`                 | Array of extra volume mounts to be added to the Kong Container (evaluated as template). Normally used with `extraVolumes`.                    | `nil`                                                   |
| `ingressController.livenessProbe`        | Liveness probe (kong ingress controller container)                                                                                            | `Check values.yaml`                                     |
| `ingressController.readinessProbe`       | Readiness probe (kong ingress controller container)                                                                                           | `Check values.yaml`                                     |
| `ingressController.customLivenessProbe`  | Override default liveness probe (kong ingress controller container)                                                                           | `nil`                                                   |
| `ingressController.customReadinessProbe` | Override default readiness probe (kong ingress controller container)                                                                          | `nil`                                                   |
| `ingressController.resources`            | Configure resource requests and limits (kong ingress controller container)                                                                    | `nil`                                                   |
| `ingressController.extraVolumeMounts`    | Array of extra volume mounts to be added to the Kong Ingress Controller container (evaluated as template). Normally used with `extraVolumes`. | `nil`                                                   |
| `migration.resources`                    | Configure resource requests and limits  (migration container)                                                                                 | `nil`                                                   |
| `migration.hostAliases`                  | Add deployment host aliases                                                                                                                   | `[]`                                                    |
| `migration.extraVolumeMounts`            | Array of extra volume mounts to be added to the Kong Container (evaluated as template). Normally used with `extraVolumes`.                    | `nil`                                                   |
| `extraDeploy`                            | Array of extra objects to deploy with the release (evaluated as a template).                                                                  | `nil`                                                   |

### Traffic Exposure Parameters

| Parameter                        | Description                                                      | Default                        |
|----------------------------------|------------------------------------------------------------------|--------------------------------|
| `service.type`                   | Kubernetes Service type                                          | `ClusterIP`                    |
| `service.externalTrafficPolicy`  | external traffic policy managing client source IP preservation   | `Cluster`                      |
| `service.exposeAdmin`            | Add the Kong Admin ports to the service                          | `false`                        |
| `service.proxyHttpPort`          | kong proxy HTTP service port port                                | `80`                           |
| `service.proxyHttpsPort`         | kong proxy HTTPS service port port                               | `443`                          |
| `service.adminHttpPort`          | kong admin HTTPS service port (only if service.exposeAdmin=true) | `8001`                         |
| `service.adminHttpsPort`         | kong admin HTTPS service port (only if service.exposeAdmin=true) | `8443`                         |
| `service.proxyHttpNodePort`      | Port to bind to for NodePort service type (proxy HTTP)           | `nil`                          |
| `service.proxyHttpsNodePort`     | Port to bind to for NodePort service type (proxy HTTPS)          | `nil`                          |
| `service.adminHttpNodePort`      | Port to bind to for NodePort service type (admin HTTP)           | `nil`                          |
| `service.aminHttpsNodePort`      | Port to bind to for NodePort service type (proxy HTTP)           | `nil`                          |
| `service.annotations`            | Annotations for kong service                                     | `{}`                           |
| `service.clusterIP`              | Cluster internal IP of the service                               | `nil`                          |
| `service.loadBalancerIP`         | loadBalancerIP if kong service type is `LoadBalancer`            | `nil`                          |
| `ingress.enabled`                | Enable ingress controller resource                               | `false`                        |
| `ingress.certManager`            | Add annotations for cert-manager                                 | `false`                        |
| `ingress.hostname`               | Default host for the ingress resource                            | `kong.local`                   |
| `ingress.apiVersion`             | Force Ingress API version (automatically detected if not set)    | ``                             |
| `ingress.path`                   | Ingress path                                                     | `/`                            |
| `ingress.pathType`               | Ingress path type                                                | `ImplementationSpecific`       |
| `ingress.tls`                    | Create TLS Secret                                                | `false`                        |
| `ingress.annotations`            | Ingress annotations                                              | `[]` (evaluated as a template) |
| `ingress.extraHosts[0].name`     | Additional hostnames to be covered                               | `nil`                          |
| `ingress.extraHosts[0].path`     | Additional hostnames to be covered                               | `nil`                          |
| `ingress.extraPaths`             | Additional arbitrary path/backend objects                        | `nil`                          |
| `ingress.extraTls[0].hosts[0]`   | TLS configuration for additional hostnames to be covered         | `nil`                          |
| `ingress.extraTls[0].secretName` | TLS configuration for additional hostnames to be covered         | `nil`                          |
| `ingress.secrets[0].name`        | TLS Secret Name                                                  | `nil`                          |
| `ingress.secrets[0].certificate` | TLS Secret Certificate                                           | `nil`                          |
| `ingress.secrets[0].key`         | TLS Secret Key                                                   | `nil`                          |

### Kong Container Parameters

| Parameter                 | Description                                                                                                                                           | Default |
|---------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|---------|
| `kong.extraEnvVars`       | Array containing extra env vars to configure Kong                                                                                                     | `nil`   |
| `kong.extraEnvVarsCM`     | ConfigMap containing extra env vars to configure Kong                                                                                                 | `nil`   |
| `kong.extraEnvVarsSecret` | Secret containing extra env vars to configure Kong (in case of sensitive data)                                                                        | `nil`   |
| `kong.command`            | Override default container command (useful when using custom images)                                                                                  | `nil`   |
| `kong.args`               | Override default container args (useful when using custom images)                                                                                     | `nil`   |
| `kong.initScriptsCM`      | ConfigMap containing `/docker-entrypoint-initdb.d` scripts to be executed at initialization time (evaluated as a template)                            | `nil`   |
| `kong.initScriptsSecret`  | Secret containing `/docker-entrypoint-initdb.d` scripts to be executed at initialization time (that contain sensitive data). Evaluated as a template. | `nil`   |

### Kong Migration job Parameters

| Parameter                      | Description                                                                                      | Default                                                                                                     |
|--------------------------------|--------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| `migration.image.registry`     | Override Kong migration job image registry (Kong image if not set)                               | `nil`                                                                                                       |
| `migration.image.repository`   | Override Kong migration job image name (Kong image if not set)                                   | `nil`                                                                                                       |
| `migration.image.tag`          | Override Kong migration job image tag (Kong image if not set)                                    | `nil`                                                                                                       |
| `migration.extraEnvVars`       | Array containing extra env vars to configure the Kong migration job                              | `nil`                                                                                                       |
| `migration.extraEnvVarsCM`     | ConfigMap containing extra env vars to configure the Kong migration job                          | `nil`                                                                                                       |
| `migration.extraEnvVarsSecret` | Secret containing extra env vars to configure the Kong migration job (in case of sensitive data) | `nil`                                                                                                       |
| `migration.command`            | Override default container command (useful when using custom images)                             | `nil`                                                                                                       |
| `migration.args`               | Override default container args (useful when using custom images)                                | `nil`                                                                                                       |
| `migration.annotations`        | Add annotations to the job                                                                       | `helm.sh/hook: post-install, post-upgrade, helm.sh/hook-delete-policy: before-hook-creation,hook-succeeded` |

### Kong Ingress Controller Container Parameters

| Parameter                                       | Description                                                                                                         | Default                                                 |
|-------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------|
| `ingressController.enabled`                     | Enable/disable the Kong Ingress Controller                                                                          | `true`                                                  |
| `ingressController.image.registry`              | Kong Ingress Controller image registry                                                                              | `docker.io`                                             |
| `ingressController.image.repository`            | Kong Ingress Controller image name                                                                                  | `bitnami/kong`                                          |
| `ingressController.image.tag`                   | Kong Ingress Controller image tag                                                                                   | `{TAG_NAME}`                                            |
| `ingressController.image.pullPolicy`            | kong ingress controller image pull policy                                                                           | `IfNotPresent`                                          |
| `ingressController.image.pullSecrets`           | Specify docker-registry secret names as an array                                                                    | `[]` (does not add image pull secrets to deployed pods) |
| `ingressController.proxyReadyTimeout`           | Maximum time (in seconds) to wait for the Kong container to be ready                                                | `300`                                                   |
| `ingressController.extraEnvVars`                | Array containing extra env vars to configure Kong                                                                   | `nil`                                                   |
| `ingressController.extraEnvVarsCM`              | ConfigMap containing extra env vars to configure Kong Ingress Controller                                            | `nil`                                                   |
| `ingressController.extraEnvVarsSecret`          | Secret containing extra env vars to configure Kong Ingress Controller (in case of sensitive data)                   | `nil`                                                   |
| `ingressController.rbac.create`                 | Create the necessary Service Accounts, Roles and Rolebindings for the Ingress Controller to work                    | `true`                                                  |
| `ingressController.rbac.existingServiceAccount` | Use an existing service account for all the RBAC operations                                                         | `nil`                                                   |
| `ingressController.customResourceDeletePolicy`  | Add custom CRD resource delete policy (for Helm 2 support)                                                          | `nil`                                                   |
| `ingressController.rbac.existingServiceAccount` | Use an existing service account for all the RBAC operations                                                         | `nil`                                                   |
| `ingressController.ingressClass`                | Name of the class to register Kong Ingress Controller (useful when having other Ingress Controllers in the cluster) | `nil`                                                   |
| `ingressController.command`                     | Override default container command (useful when using custom images)                                                | `nil`                                                   |
| `ingressController.args`                        | Override default container args (useful when using custom images)                                                   | `nil`                                                   |

### PostgreSQL Parameters

| Parameter                       | Description                                                                                                                    | Default |
|---------------------------------|--------------------------------------------------------------------------------------------------------------------------------|---------|
| `postgresql.enabled`            | Deploy the PostgreSQL sub-chart                                                                                                | `true`  |
| `postgresql.usePasswordFile`    | Mount the PostgreSQL secret as a file                                                                                          | `no`    |
| `postgresql.existingSecret`     | Use an existing secret file with the PostgreSQL password (can be used with the bundled chart or with an existing installation) | `nil`   |
| `postgresql.postgresqlDatabase` | Database name to be used by Kong                                                                                               | `kong`  |
| `postgresql.postgresqlUsername` | Username to be created by the PostgreSQL bundled chart                                                                         | `kong`  |
| `postgresql.external.host`      | Host of an external PostgreSQL installation                                                                                    | `nil`   |
| `postgresql.external.user`      | Username of the external PostgreSQL installation                                                                               | `nil`   |
| `postgresql.external.password`  | Password of the external PostgreSQL installation                                                                               | `nil`   |

### Cassandra Parameters

| Parameter                     | Description                                                                                                                   | Default |
|-------------------------------|-------------------------------------------------------------------------------------------------------------------------------|---------|
| `cassandra.enabled`           | Deploy the Cassandra sub-chart                                                                                                | `false` |
| `cassandra.usePasswordFile`   | Mount the Cassandra secret as a file                                                                                          | `no`    |
| `cassandra.existingSecret`    | Use an existing secret file with the Cassandra password (can be used with the bundled chart or with an existing installation) | `nil`   |
| `cassandra.dbUser.user`       | Username to be created by the cassandra bundled chart                                                                         | `kong`  |
| `cassandra.external.hosts`    | Hosts of an external cassandra installation                                                                                   | `nil`   |
| `cassandra.external.port`     | Port of an external cassandra installation                                                                                    | `nil`   |
| `cassandra.external.user`     | Username of the external cassandra installation                                                                               | `nil`   |
| `cassandra.external.password` | Password of the external cassandra installation                                                                               | `nil`   |

### Metrics Parameters

| Parameter                               | Description                                                                                            | Default                                   |
|-----------------------------------------|--------------------------------------------------------------------------------------------------------|-------------------------------------------|
| `metrics.enabled`                       | Enable the export of Prometheus metrics                                                                | `false`                                   |
| `metrics.service.type`                  | Type of the Prometheus metrics service                                                                 | `ClusterIP file`                          |
| `metrics.service.port`                  | Port of the Prometheus metrics service                                                                 | `9119`                                    |
| `metrics.service.annotations`           | Port for Prometheus metrics service                                                                    | `9119`                                    |
| `metrics.service.annotations`           | Annotations for Prometheus metrics service                                                             | `Check values.yaml file`                  |
| `metrics.serviceMonitor.enabled`        | if `true`, creates a Prometheus Operator ServiceMonitor (also requires `metrics.enabled` to be `true`) | `false`                                   |
| `metrics.serviceMonitor.namespace`      | Namespace in which Prometheus is running                                                               | `nil`                                     |
| `metrics.serviceMonitor.serviceAccount` | Service account used by Prometheus                                                                     | `nil`                                     |
| `metrics.serviceMonitor.rbac.create`    | if `true`, creates a Role and Role binding for Prometheus so it can reach kong's namespace             | `true`                                    |
| `metrics.serviceMonitor.interval`       | Interval at which metrics should be scraped.                                                           | `nil` (Prometheus Operator default value) |
| `metrics.serviceMonitor.scrapeTimeout`  | Timeout after which the scrape is ended                                                                | `nil` (Prometheus Operator default value) |
| `metrics.serviceMonitor.selector`       | Prometheus instance selector labels                                                                    | `nil`                                     |

Specify each parameter using the `--set key=value[,key=value]` argument to `helm install`. For example,

```console
  helm install my-release \
  --set service.exposeAdmin=true bitnami/kong
```

The above command exposes the Kong admin ports inside the Kong service.

Alternatively, a YAML file that specifies the values for the parameters can be provided while installing the chart. For example,

```console
  helm install my-release -f values.yaml bitnami/kong
```

> **Tip**: You can use the default [values.yaml](values.yaml)

## Configuration and installation details

### [Rolling VS Immutable tags](https://docs.bitnami.com/containers/how-to/understand-rolling-tags-containers/)

It is strongly recommended to use immutable tags in a production environment. This ensures your deployment does not change automatically if the same tag is updated with a different image.

Bitnami will release a new chart updating its containers if a new version of the main container, significant changes, or critical vulnerabilities exist.

### Database backend

The Bitnami Kong chart allows setting two database backends: PostgreSQL or Cassandra. For each option, there are two extra possibilities: deploy a sub-chart with the database installation or use an existing one. The list below details the different options (replace the placeholders specified between _UNDERSCORES_):

- Deploy the PostgreSQL sub-chart (default)

```console
  helm install my-release bitnami/kong
```

- Use an external PostgreSQL database

```console
  helm install my-release bitnami/kong \
    --set postgresql.enabled=false \
    --set postgresql.external.host=_HOST_OF_YOUR_POSTGRESQL_INSTALLATION_ \
    --set postgresql.external.password=_PASSWORD_OF_YOUR_POSTGRESQL_INSTALLATION_ \
    --set postgresql.external.user=_USER_OF_YOUR_POSTGRESQL_INSTALLATION_
```

- Deploy the Cassandra sub-chart

```console
  helm install my-release bitnami/kong \
    --set database=cassandra \
    --set postgresql.enabled=false \
    --set cassandra.enabled=true
```

- Use an existing Cassandra installation

```console
  helm install my-release bitnami/kong \
    --set database=cassandra \
    --set postgresql.enabled=false \
    --set cassandra.enabled=false \
    --set cassandra.external.hosts[0]=_CONTACT_POINT_0_OF_YOUR_CASSANDRA_CLUSTER_ \
    --set cassandra.external.hosts[1]=_CONTACT_POINT_1_OF_YOUR_CASSANDRA_CLUSTER_ \
    ...
    --set cassandra.external.user=_USER_OF_YOUR_CASSANDRA_INSTALLATION_ \
    --set cassandra.external.password=_PASSWORD_OF_YOUR_CASSANDRA_INSTALLATION_
```

### DB-less

Kong 1.1 added the capability to run Kong without a database, using only in-memory storage for entities: we call this DB-less mode. When running Kong DB-less, the configuration of entities is done in a second configuration file, in YAML or JSON, using declarative configuration (ref. [Link](https://docs.konghq.com/gateway-oss/1.1.x/db-less-and-declarative-config/)).
As is said in step 4 of [kong official docker installation](https://docs.konghq.com/install/docker#db-less-mode), just add the env variable "KONG_DATABASE=off".

#### How to enable it

1. Set `database` value with any value other than "postgresql" or "cassandra". For example `database: "off"`
2. Use `kong.extraEnvVars` value to set the `KONG_DATABASE` environment variable:
```yaml
kong.extraEnvVars:
- name: KONG_DATABASE
  value: "off"
```

### Sidecars and Init Containers

If you have a need for additional containers to run within the same pod as Kong (e.g. an additional metrics or logging exporter), you can do so via the `sidecars` config parameter. Simply define your container according to the Kubernetes container spec.

```yaml
sidecars:
  - name: your-image-name
    image: your-image
    imagePullPolicy: Always
    ports:
      - name: portname
       containerPort: 1234
```

Similarly, you can add extra init containers using the `initContainers` parameter.

```yaml
initContainers:
  - name: your-image-name
    image: your-image
    imagePullPolicy: Always
    ports:
      - name: portname
        containerPort: 1234
```

### Adding extra environment variables

In case you want to add extra environment variables (useful for advanced operations like custom init scripts), you can use the `kong.extraEnvVars` property.

```yaml
kong:
  extraEnvVars:
    - name: KONG_LOG_LEVEL
      value: error
```

Alternatively, you can use a ConfigMap or a Secret with the environment variables. To do so, use the `kong.extraEnvVarsCM` or the `kong.extraEnvVarsSecret` values.

The Kong Ingress Controller and the Kong Migration job also allow this kind of configuration via the `ingressController.extraEnvVars`, `ingressController.extraEnvVarsCM`, `ingressController.extraEnvVarsSecret`, `migration.extraEnvVars`, `migration.extraEnvVarsCM` and `migration.extraEnvVarsSecret` values.

### Using custom init scripts

For advanced operations, the Bitnami Kong charts allows using custom init scripts that will be mounted in `/docker-entrypoint.init-db`. You can use a ConfigMap or a Secret (in case of sensitive data) for mounting these extra scripts. Then use the `kong.initScriptsCM` and `kong.initScriptsSecret` values.

```console
elasticsearch.hosts[0]=elasticsearch-host
elasticsearch.port=9200
initScriptsCM=special-scripts
initScriptsSecret=special-scripts-sensitive
```

### Deploying extra resources

There are cases where you may want to deploy extra objects, such as KongPlugins, KongConsumers, amongst others. For covering this case, the chart allows adding the full specification of other objects using the `extraDeploy` parameter. The following example would activate a plugin at deployment time.

```yaml
## Extra objects to deploy (value evaluated as a template)
##
extraDeploy: |-
  - apiVersion: configuration.konghq.com/v1
    kind: KongPlugin
    metadata:
      name: {{ include "common.names.fullname" . }}-plugin-correlation
      namespace: {{ .Release.Namespace }}
      labels: {{- include "common.labels.standard" . | nindent 6 }}
    config:
      header_name: my-request-id
    plugin: correlation-id
```

### Setting Pod's affinity

This chart allows you to set your custom affinity using the `affinity` parameter. Find more information about Pod's affinity in the [kubernetes documentation](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#affinity-and-anti-affinity).

As an alternative, you can use of the preset configurations for pod affinity, pod anti-affinity, and node affinity available at the [bitnami/common](https://github.com/bitnami/charts/tree/master/bitnami/common#affinities) chart. To do so, set the `podAffinityPreset`, `podAntiAffinityPreset`, or `nodeAffinityPreset` parameters.

## Troubleshooting

Find more information about how to deal with common errors related to Bitnami’s Helm charts in [this troubleshooting guide](https://docs.bitnami.com/general/how-to/troubleshoot-helm-chart-issues).

## Upgrading

It's necessary to specify the existing passwords while performing a upgrade to ensure the secrets are not updated with invalid randomly generated passwords. Remember to specify the existing values of the `postgresql.postgresqlPassword` or `cassandra.password` parameters when upgrading the chart:

```bash
$ helm upgrade my-release bitnami/kong \
    --set database=postgresql
    --set postgresql.enabled=true
    --set
    --set postgresql.postgresqlPassword=[POSTGRESQL_PASSWORD]
```

> Note: you need to substitute the placeholders _[POSTGRESQL_PASSWORD]_ with the values obtained from instructions in the installation notes.

### To 3.1.0

Kong Ingress Controller version was bumped to new major version, `1.x.x`. The associated CRDs were updated accordingly.

### To 3.0.0

[On November 13, 2020, Helm v2 support was formally finished](https://github.com/helm/charts#status-of-the-project), this major version is the result of the required changes applied to the Helm Chart to be able to incorporate the different features added in Helm v3 and to be consistent with the Helm project itself regarding the Helm v2 EOL.

**What changes were introduced in this major version?**

- Previous versions of this Helm Chart use `apiVersion: v1` (installable by both Helm 2 and 3), this Helm Chart was updated to `apiVersion: v2` (installable by Helm 3 only). [Here](https://helm.sh/docs/topics/charts/#the-apiversion-field) you can find more information about the `apiVersion` field.
- Move dependency information from the *requirements.yaml* to the *Chart.yaml*
- After running `helm dependency update`, a *Chart.lock* file is generated containing the same structure used in the previous *requirements.lock*
- The different fields present in the *Chart.yaml* file has been ordered alphabetically in a homogeneous way for all the Bitnami Helm Charts
- This chart depends on the **PostgreSQL 10** instead of **PostgreSQL 9**. Apart from the same changes that are described in this section, there are also other major changes due to the master/slave nomenclature was replaced by primary/readReplica. [Here](https://github.com/bitnami/charts/pull/4385) you can find more information about the changes introduced.

**Considerations when upgrading to this version**

- If you want to upgrade to this version using Helm v2, this scenario is not supported as this version doesn't support Helm v2 anymore
- If you installed the previous version with Helm v2 and wants to upgrade to this version with Helm v3, please refer to the [official Helm documentation](https://helm.sh/docs/topics/v2_v3_migration/#migration-use-cases) about migrating from Helm v2 to v3
- If you want to upgrade to this version from a previous one installed with Helm v3, it should be done reusing the PVC used to hold the PostgreSQL data on your previous release. To do so, follow the instructions below (the following example assumes that the release name is `kong`):

> NOTE: Please, create a backup of your database before running any of those actions.

##### Export secrets and required values to update

```console
$ export POSTGRESQL_PASSWORD=$(kubectl get secret --namespace default kong-postgresql -o jsonpath="{.data.postgresql-password}" | base64 --decode)
$ export POSTGRESQL_PVC=$(kubectl get pvc -l app.kubernetes.io/instance=kong,app.kubernetes.io/name=postgresql,role=master -o jsonpath="{.items[0].metadata.name}")
```

##### Delete statefulsets

Delete PostgreSQL statefulset. Notice the option `--cascade=false`:

```
$ kubectl delete statefulsets.apps kong-postgresql --cascade=false
```

##### Upgrade the chart release

```console
$ helm upgrade kong bitnami/kong \
    --set postgresql.postgresqlPassword=$POSTGRESQL_PASSWORD \
    --set postgresql.persistence.existingClaim=$POSTGRESQL_PVC
```

##### Force new statefulset to create a new pod for postgresql

```console
$ kubectl delete pod kong-postgresql-0
```
Finally, you should see the lines below in MariaDB container logs:

```console
$ kubectl logs $(kubectl get pods -l app.kubernetes.io/instance=postgresql,app.kubernetes.io/name=postgresql,role=primary -o jsonpath="{.items[0].metadata.name}")
...
postgresql 08:05:12.59 INFO  ==> Deploying PostgreSQL with persisted data...
...
```

**Useful links**

- https://docs.bitnami.com/tutorials/resolve-helm2-helm3-post-migration-issues/
- https://helm.sh/docs/topics/v2_v3_migration/
- https://helm.sh/blog/migrate-from-helm-v2-to-helm-v3/

### To 2.0.0

PostgreSQL and Cassandra dependencies versions were bumped to new major versions, `9.x.x` and `6.x.x` respectively. Both of these include breaking changes and hence backwards compatibility is no longer guaranteed.

In order to properly migrate your data to this new version:

* If you were using PostgreSQL as your database, please refer to the [PostgreSQL Upgrade Notes](https://github.com/bitnami/charts/tree/master/bitnami/postgresql#900).

* If you were using Cassandra as your database, please refer to the [Cassandra Upgrade Notes](https://github.com/bitnami/charts/tree/master/bitnami/cassandra#to-600).
