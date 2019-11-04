{{/* vim: set filetype=mustache: */}}
{{/*
Expand the name of the chart.
*/}}
{{- define "ethereum.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "ethereum.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := "" -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "ethereum.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "standard.labels" -}}
{{- include "standard.short_labels" . }}
chart: {{ template "ethereum.chart" . }}
heritage: {{ .Release.Service }}
{{- end -}}

{{- define "standard.short_labels" -}}
app: {{ template "ethereum.name" . }}
release: {{ .Release.Name }}
{{- end -}}


{{- define "celo.init-genesis-container" -}}
- name: init-genesis
  image: {{ .Values.geth.image.repository }}:{{ .Values.geth.image.tag }}
  imagePullPolicy: {{ .Values.imagePullPolicy }}
  args:
  - "init"
  - "/var/geth/genesis.json"
  volumeMounts:
  - name: data
    mountPath: /root/.celo
  - name: config
    mountPath: /var/geth
{{- end -}}

{{- define "celo.get-bootnodes-container" -}}
- name: get-bootnodes
  image: celohq/minimal:latest
  imagePullPolicy: {{ .Values.imagePullPolicy }}
  command: ["/bin/sh"]
  args:
  - "-c"
  - |-
{{ .Files.Get "scripts/get-bootnode.sh" | indent 4 }}
  env:
  - name: BOOTNODE_SVC
    value: {{ template "ethereum.fullname" . }}-bootnode.{{ .Release.Namespace }}
  volumeMounts:
  - name: data
    mountPath: /geth
{{- end -}}

{{- define "celo.node-volumes" -}}
volumes:
- name: data
  persistentVolumeClaim:
    claimName: {{ template "ethereum.fullname" . }}-{{ .node_prefix }}-pvc
- name: config
  configMap:
    name: {{ template "ethereum.fullname" . }}-geth-config
- name: account
  secret:
    secretName: {{ template "ethereum.fullname" . }}-geth-account
{{- end -}}

{{- define "celo.node-pvc" -}}
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: {{ template "ethereum.fullname" . }}-{{ .pvc_name }}
  labels:
    app: {{ template "ethereum.name" . }}
    chart: {{ template "ethereum.chart" . }}
    release: {{ .Release.Name }}
    heritage: {{ .Release.Service }}
    component: {{ .pvc_name }}
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: ssd
  resources:
    requests:
      storage: 100Gi
{{- end -}}

{{- define "celo.geth-exporter-container" -}}
- name: geth-exporter
  image: "{{ .Values.gethexporter.image.repository }}:{{ .Values.gethexporter.image.tag }}"
  imagePullPolicy: {{ .Values.imagePullPolicy }}
  ports:
    - name: profiler
      containerPort: 9200
  command:
    - /usr/local/bin/geth_exporter
    - -ipc
    - /root/.celo/geth.ipc
    - -filter
    - (.*overall|percentiles_95)
  resources:
    requests:
      memory: 50M
      cpu: 50m
  volumeMounts:
  - name: data
    mountPath: /root/.celo
{{- end -}}

{{- define "celo.prom-to-sd-container" -}}
- name: prom-to-sd
  image: "{{ .Values.promtosd.image.repository }}:{{ .Values.promtosd.image.tag }}"
  imagePullPolicy: {{ .Values.imagePullPolicy }}
  ports:
    - name: profiler
      containerPort: {{ .Values.promtosd.port }}
  command:
    - /monitor
    - --stackdriver-prefix=custom.googleapis.com
    - --source={{ .component }}:http://localhost:{{ .metricsPort }}/{{ .metricsPath | default "metrics" }}?containerNameLabel={{ .containerNameLabel }}
    - --pod-id=$(POD_NAME)
    - --namespace-id=$(POD_NAMESPACE)
    - --scrape-interval={{ .Values.promtosd.scrape_interval }}
    - --export-interval={{ .Values.promtosd.export_interval }}
  resources:
    requests:
      memory: 50M
      cpu: 50m
  env:
    - name: POD_NAME
      valueFrom:
        fieldRef:
          fieldPath: metadata.name
    - name: POD_NAMESPACE
      valueFrom:
        fieldRef:
          fieldPath: metadata.namespace
{{- end -}}

{{- define "celo.miner-deployment" -}}
apiVersion: apps/v1beta2
kind: Deployment
metadata:
  name: {{ template "ethereum.fullname" . }}-{{ .Node.name }}
  labels:
{{ include "standard.labels" .  | indent 4 }}
    component: {{ .Node.name }}
    type: sealer
spec:
  strategy:
    type: Recreate
  replicas: {{ .Values.geth.miner.replicaCount }}
  selector:
    matchLabels:
{{ include "standard.short_labels" .  | indent 6 }}
      component: {{ .Node.name }}
      type: sealer
  template:
    metadata:
      labels:
{{ include "standard.short_labels" .  | indent 8 }}
        component: {{ .Node.name }}
        type: sealer
    spec:
      containers:
      - name: geth
        image: {{ .Values.geth.image.repository }}:{{ .Values.geth.image.tag }}
        imagePullPolicy: {{ .Values.imagePullPolicy }}
        command: ["/bin/sh"]
        args:
        - "-c"
        - "geth --bootnodes=`cat /root/.celo/bootnodes` \
          --consoleformat=json \
          --consoleoutput=stdout \
          --etherbase=${ACCOUNT_ADDRESS} \
          --ethstats=${HOSTNAME}:${ETHSTATS_SECRET}@${ETHSTATS_SVC} \
          --metrics \
          --mine \
          --miner.verificationpool=${VERIFICATION_POOL_URL} \
          --networkid=${NETWORK_ID} \
          --nodekey=/root/.celo/account/{{ .Node.name}}PrivateKey \
          --password=/root/.celo/account/accountSecret \
          --rpc \
          --rpcaddr 0.0.0.0 \
          --rpcapi=eth,net,web3,debug,txpool \
          --rpccorsdomain=* \
          --rpcvhosts=* \
          --syncmode=full \
          --unlock=${ACCOUNT_ADDRESS} \
          --verbosity={{ .Values.geth.verbosity }} \
          --ws \
          --wsaddr 0.0.0.0 \
          --wsapi=eth,net,web3,debug,txpool \
          --wsorigins=*"
        ports:
        - name: discovery-udp
          containerPort: 30303
          protocol: UDP
        - name: discovery-tcp
          containerPort: 30303
        - name: rpc
          containerPort: 8545
        - name: ws
          containerPort: 8546
        resources:
          requests:
            memory: {{ .Values.geth.node.memory_request }}
            cpu: {{ .Values.geth.node.cpu_request }}
        volumeMounts:
        - name: data
          mountPath: /root/.celo
        - name: account
          readOnly: true
          mountPath: /root/.celo/account
        - name: config
          mountPath: /var/geth
        env:
        - name: ETHSTATS_SVC
          value: {{ template "ethereum.fullname" . }}-ethstats.{{ .Release.Namespace }}
        - name: ETHSTATS_SECRET
          valueFrom:
            secretKeyRef:
              name: {{ template "ethereum.fullname" . }}-ethstats
              key: WS_SECRET
        - name: ACCOUNT_ADDRESS
          value: {{ .Node.address }}
        - name: NETWORK_ID
          valueFrom:
            configMapKeyRef:
              name: {{ template "ethereum.fullname" . }}-geth-config
              key: networkid
        - name: VERIFICATION_POOL_URL
          value: {{ .Values.geth.miner.verificationpool }}
        - name: VERIFICATION_REWARDS_URL
          value: {{ .Values.verification.rewardsUrl }}
{{ include "celo.geth-exporter-container" .  | indent 6 }}
{{ include "celo.prom-to-sd-container" (dict "Values" .Values "Release" .Release "Chart" .Chart "component" "geth" "metricsPort" "9200" "metricsPath" "filteredmetrics" "containerNameLabel" .Node.name )  | indent 6 }}
      initContainers:
{{ include "celo.init-genesis-container" .  | indent 6 }}
{{ include "celo.get-bootnodes-container" .  | indent 6 }}
      - name: import-geth-account
        image: {{ .Values.geth.image.repository }}:{{ .Values.geth.image.tag }}
        imagePullPolicy: {{ .Values.imagePullPolicy }}
        command: ["/bin/sh"]
        args:
        - "-c"
        - "geth account import --password /root/.celo/account/accountSecret /root/.celo/account/{{ .Node.name}}PrivateKey || true"
        volumeMounts:
        - name: data
          mountPath: /root/.celo
        - name: account
          readOnly: true
          mountPath: /root/.celo/account
{{ include "celo.node-volumes" (dict "Values" .Values "Release" .Release "Chart" .Chart "node_prefix" .Node.name)  | indent 6 }}
    {{- with .Values.nodeSelector }}
      nodeSelector:
{{ toYaml . | indent 8 }}
    {{- end -}}
{{- end -}}

{{- define "celo.tx-deployment" -}}
apiVersion: apps/v1beta2
kind: Deployment
metadata:
  name: {{ template "ethereum.fullname" . }}-{{ .node_name }}
  labels:
{{ include "standard.labels" .  | indent 4 }}
    component: {{ .node_name }}
spec:
  strategy:
    type: Recreate
  replicas: {{ .Values.geth.tx.replicaCount }}
  selector:
    matchLabels:
{{ include "standard.short_labels" .  | indent 6 }}
      component: {{ .node_name }}
  template:
    metadata:
      labels:
{{ include "standard.short_labels" .  | indent 8 }}
        component: {{ .node_name }}
    spec:
      containers:
      - name: geth
        image: {{ .Values.geth.image.repository }}:{{ .Values.geth.image.tag }}
        imagePullPolicy: {{ .Values.imagePullPolicy }}
        command: ["/bin/sh"]
        args:
        - "-c"
        - "geth --bootnodes=`cat /root/.celo/bootnodes` \
          --consoleformat=json \
          --consoleoutput=stdout \
          --ethstats=${HOSTNAME}:${ETHSTATS_SECRET}@${ETHSTATS_SVC} \
          --lightpeers 250 \
          --lightserv 90 \
          --metrics \
          --networkid=${NETWORK_ID} \
          --nodekey=/root/.celo/account/{{ .node_name }}NodeKey \
          --rpc \
          --rpcaddr 0.0.0.0 \
          --rpcapi=eth,net,web3,debug,txpool \
          --rpccorsdomain=* \
          --rpcvhosts=* \
          --targetgaslimit=${TARGET_GAS_LIMIT} \
          --verbosity={{ .Values.geth.verbosity }} \
          --ws \
          --wsaddr 0.0.0.0 \
          --wsapi=eth,net,web3,debug,txpool \
          --wsorigins=*"
        ports:
        - name: discovery-udp
          containerPort: 30303
          protocol: UDP
        - name: discovery-tcp
          containerPort: 30303
        - name: rpc
          containerPort: 8545
        - name: ws
          containerPort: 8546
        resources:
          requests:
            memory: {{ .Values.geth.node.memory_request }}
            cpu: {{ .Values.geth.node.cpu_request }}
        volumeMounts:
        - name: data
          mountPath: /root/.celo
        - name: account
          readOnly: true
          mountPath: /root/.celo/account
        env:
        - name: ETHSTATS_SVC
          value: {{ template "ethereum.fullname" . }}-ethstats.{{ .Release.Namespace }}
        - name: ETHSTATS_SECRET
          valueFrom:
            secretKeyRef:
              name: {{ template "ethereum.fullname" . }}-ethstats
              key: WS_SECRET
        - name: TARGET_GAS_LIMIT
          value: {{ .Values.geth.genesis.gasLimit | quote }}
        - name: NETWORK_ID
          valueFrom:
            configMapKeyRef:
              name: {{ template "ethereum.fullname" . }}-geth-config
              key: networkid
{{ include "celo.geth-exporter-container" .  | indent 6 }}
{{ include "celo.prom-to-sd-container" (dict "Values" .Values "Release" .Release "Chart" .Chart "component" "geth" "metricsPort" "9200" "metricsPath" "filteredmetrics" "containerNameLabel" .node_name)  | indent 6 }}
      initContainers:
{{ include "celo.init-genesis-container" .  | indent 6 }}
{{ include "celo.get-bootnodes-container" .  | indent 6 }}
{{ include "celo.node-volumes" (dict "Values" .Values "Release" .Release "Chart" .Chart "node_prefix" .node_name) | indent 6 }}
    {{- with .Values.nodeSelector -}}
      nodeSelector:
{{ toYaml . | indent 8 }}
    {{- end -}}
{{- end -}}

{{- define "celo.tx-service" -}}
kind: Service
apiVersion: v1
metadata:
  name: {{ template "ethereum.fullname" . }}-{{ .node_name }}
  labels:
    app: {{ template "ethereum.name" . }}
    chart: {{ template "ethereum.chart" . }}
    release: {{ .Release.Name }}
    heritage: {{ .Release.Service }}
    component: {{ .node_name }}
spec:
  selector:
    app: {{ template "ethereum.name" . }}
    release: {{ .Release.Name }}
    component: {{ .node_name }}
  type: LoadBalancer
  loadBalancerIP: {{ .loadbalancer_ip }}
  sessionAffinity: ClientIP
  ports:
  - name: discovery
    port: 30303
  - name: rpc
    port: 8545
  - name: ws
    port: 8546
{{- end -}}

{{- define "celo.node-service" -}}
kind: Service
apiVersion: v1
metadata:
  name: {{ template "ethereum.fullname" $ }}-{{ .node_type }}-{{ .index }}{{ .name_suffix }}
  labels:
    app: {{ template "ethereum.name" $ }}
    chart: {{ template "ethereum.chart" $ }}
    release: {{ $.Release.Name }}
    heritage: {{ $.Release.Service }}
    component: {{ .component_label }}
spec:
  selector:
    app: {{ template "ethereum.name" $ }}
    release: {{ $.Release.Name }}
    component: {{ .component_label }}
    statefulset.kubernetes.io/pod-name: {{ template "ethereum.fullname" $ }}-{{ .node_type }}-{{ .index }}
  type: {{ .service_type }}
  {{ if (eq .service_type "LoadBalancer") }}
  loadBalancerIP: {{ .load_balancer_ip }}
  {{ end }}
{{- end -}}

{{- define "celo.full-node-statefulset" -}}
apiVersion: v1
kind: Service
metadata:
  name: {{ .name }}
  labels:
    component: {{ .component_label }}
spec:
  ports:
  - port: 8545
    name: rpc
  - port: 8546
    name: ws
  selector:
    component: {{ .component_label }}
---
apiVersion: apps/v1beta2
kind: StatefulSet
metadata:
  name: {{ template "ethereum.fullname" . }}-{{ .name }}
  labels:
{{ include "standard.labels" .  | indent 4 }}
    component: {{ .component_label }}
spec:
  {{ if .Values.geth.ssd_disks }}
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      storageClassName: ssd
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 10Gi
  {{ end }}
  podManagementPolicy: Parallel
  replicas: {{ .replicas }}
  serviceName: {{ .name }}
  selector:
    matchLabels:
{{ include "standard.labels" .  | indent 6 }}
      component: {{ .component_label }}
  template:
    metadata:
      labels:
{{ include "standard.labels" .  | indent 8 }}
        component: {{ .component_label }}
    spec:
      initContainers:
{{ include "celo.init-genesis-container" .  | indent 6 }}
      - name: get-account
        image: {{ .Values.celotool.image.repository }}:{{ .Values.celotool.image.tag }}
        imagePullPolicy: IfNotPresent
        command:
          - bash
          - "-c"
          - |
            [[ $REPLICA_NAME =~ -([0-9]+)$ ]] || exit 1
            RID=${BASH_REMATCH[1]}
            echo "Generating private key for rid=$RID"
            celotooljs.sh generate bip32 --mnemonic "$MNEMONIC" --accountType {{ .mnemonic_account_type }} --index $RID > /root/.celo/pkey
            echo 'Generating address'
            celotooljs.sh generate account-address --private-key `cat /root/.celo/pkey` > /root/.celo/address
            echo -n "Generating IP address for tx node: "
            if [ -z $IP_ADDRESSES ]; then
              echo 'No IP_ADDRESSES'
              # to use the IP address of a service from an env var that Kubernetes creates
              SERVICE_ENV_VAR_PREFIX={{ .service_ip_env_var_prefix }}
              if [ "$SERVICE_ENV_VAR_PREFIX" ]; then
                echo 'Using SERVICE_ENV_VAR_PREFIX'
                eval "echo \${${SERVICE_ENV_VAR_PREFIX}${RID}_SERVICE_HOST}"
                echo ${SERVICE_ENV_VAR_PREFIX}${RID}_SERVICE_HOST
                env
                eval "echo \${${SERVICE_ENV_VAR_PREFIX}${RID}_SERVICE_HOST}" > /root/.celo/ipAddress
              else
                echo 'Using POD_IP'
                echo $POD_IP > /root/.celo/ipAddress
              fi
            else
              echo 'Using IP_ADDRESSES'
              echo $IP_ADDRESSES | cut -d '/' -f $((RID + 1)) > /root/.celo/ipAddress
            fi
            cat /root/.celo/ipAddress
            echo -n "Generating Bootnode enode address for tx node: "
            celotooljs.sh generate public-key --mnemonic "$MNEMONIC" --accountType load_testing --index 0 > /root/.celo/bootnodeEnodeAddress
            cat /root/.celo/bootnodeEnodeAddress
            echo
            [[ "$BOOTNODE_IP_ADDRESS" == 'none' ]] && BOOTNODE_IP_ADDRESS=${{ .Release.Namespace | upper }}_BOOTNODE_SERVICE_HOST
            echo `cat /root/.celo/bootnodeEnodeAddress`@$BOOTNODE_IP_ADDRESS:30301 > /root/.celo/bootnodeEnode
            echo -n "Generating Bootnode enode for tx node: "
            cat /root/.celo/bootnodeEnode
        env:
        - name: BOOTNODE_IP_ADDRESS
          value: {{ default "none" .Values.geth.bootnodeIpAddress  }}
        - name: REPLICA_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: MNEMONIC
          valueFrom:
            secretKeyRef:
              name: {{ template "ethereum.fullname" . }}-geth-account
              key: mnemonic
        - name: IP_ADDRESSES
          value: {{ .ip_addresses }}
        volumeMounts:
        - name: data
          mountPath: /root/.celo
      containers:
      - name: geth
        image: {{ .Values.geth.image.repository }}:{{ .Values.geth.image.tag }}
        imagePullPolicy: IfNotPresent
        command: ["/bin/sh"]
        args:
        - "-c"
        - |-
          set -euo pipefail
          ACCOUNT_ADDRESS=`cat /root/.celo/address`
          NAT_FLAG="--nat=extip:`cat /root/.celo/ipAddress`"
          PING_IP_FROM_PACKET_FLAG=""
          [[ "$PING_IP_FROM_PACKET" == "true" ]] && PING_IP_FROM_PACKET_FLAG="--ping-ip-from-packet"
          IN_MEMORY_DISCOVERY_TABLE_FLAG=""
          [[ "$IN_MEMORY_DISCOVERY_TABLE" == "true" ]] && IN_MEMORY_DISCOVERY_TABLE_FLAG="--use-in-memory-discovery-table"
          ADDITIONAL_FLAGS='{{ .geth_flags | default "" }}'
          geth \
            --bootnodes=enode://`cat /root/.celo/bootnodeEnode` \
            --lightserv 90 \
            --lightpeers 1000 \
            --maxpeers 1100 \
            --rpc \
            --rpcaddr 0.0.0.0 \
            --rpcapi=eth,net,web3,debug \
            --rpccorsdomain='*' \
            --rpcvhosts=* \
            --ws \
            --wsaddr 0.0.0.0 \
            --wsorigins=* \
            --wsapi=eth,net,web3,debug \
            --nodekey=/root/.celo/pkey \
            --etherbase=${ACCOUNT_ADDRESS} \
            --networkid=${NETWORK_ID} \
            --syncmode=full \
            ${NAT_FLAG} \
            --ethstats=${HOSTNAME}:${ETHSTATS_SECRET}@${ETHSTATS_SVC} \
            --miner.verificationpool=${VERIFICATION_POOL_URL} \
            --consoleformat=json \
            --consoleoutput=stdout \
            --verbosity={{ .Values.geth.verbosity }} \
            --ethstats=${HOSTNAME}:${ETHSTATS_SECRET}@${ETHSTATS_SVC} \
            --metrics \
            ${PING_IP_FROM_PACKET_FLAG} \
            ${IN_MEMORY_DISCOVERY_TABLE_FLAG} \
            ${ADDITIONAL_FLAGS}
        env:
        - name: ETHSTATS_SVC
          value: {{ template "ethereum.fullname" . }}-ethstats.{{ .Release.Namespace }}
        - name: ETHSTATS_SECRET
          valueFrom:
            secretKeyRef:
              name: {{ template "ethereum.fullname" . }}-ethstats
              key: WS_SECRET
        - name: NETWORK_ID
          valueFrom:
            configMapKeyRef:
              name: {{ template "ethereum.fullname" . }}-geth-config
              key: networkid
        - name: VERIFICATION_POOL_URL
          value: {{ .Values.geth.miner.verificationpool }}
        - name: STATIC_IPS_FOR_GETH_NODES
          value: "{{ default "false" .Values.geth.static_ips }}"
        - name: PING_IP_FROM_PACKET
          value: "{{ default "false" .Values.geth.ping_ip_from_packet }}"
        - name: IN_MEMORY_DISCOVERY_TABLE
          value: "{{ default "false" .Values.geth.in_memory_discovery_table }}"
        ports:
        - name: discovery-udp
          containerPort: 30303
          protocol: UDP
        - name: discovery-tcp
          containerPort: 30303
        {{ if .sentry }}
        - name: sentry-udp
          containerPort: 30503
          protocol: UDP
        - name: sentry-tcp
          containerPort: 30503
        {{ end }}
        - name: rpc
          containerPort: 8545
        - name: ws
          containerPort: 8546
        resources:
          requests:
            memory: {{ .Values.geth.node.memory_request }}
            cpu: {{ .Values.geth.node.cpu_request }}
        volumeMounts:
        - name: data
          mountPath: /root/.celo
        - name: account
          mountPath: /root/.celo/account
          readOnly: true
{{ include "celo.geth-exporter-container" .  | indent 6 }}
{{ include "celo.prom-to-sd-container" (dict "Values" .Values "Release" .Release "Chart" .Chart "component" "geth" "metricsPort" "9200" "metricsPath" "filteredmetrics" "containerNameLabel" .name )  | indent 6 }}
      volumes:
      - name: data
        emptyDir: {}
      - name: config
        configMap:
          name: {{ template "ethereum.fullname" . }}-geth-config
      - name: account
        secret:
          secretName: {{ template "ethereum.fullname" . }}-geth-account
{{- end -}}
