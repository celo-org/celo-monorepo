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

{{- /* This template does not define ports that will be exposed */ -}}
{{- define "celo.node-service" -}}
kind: Service
apiVersion: v1
metadata:
  name: {{ template "ethereum.fullname" $ }}-{{ .svc_name | default .node_name }}-{{ .index }}{{ .svc_name_suffix | default "" }}
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
    statefulset.kubernetes.io/pod-name: {{ template "ethereum.fullname" $ }}-{{ .node_name }}-{{ .index }}
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
  sessionAffinity: ClientIP
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
          storage: 2Gi
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
{{ include "common.init-genesis-container" .  | indent 6 }}
      - name: get-account
        image: {{ .Values.celotool.image.repository }}:{{ .Values.celotool.image.tag }}
        imagePullPolicy: Always
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
            {{ if .proxy }}
            # Generating the account address of the validator
            echo "Generating the account address of the validator $RID"
            celotooljs.sh generate bip32 --mnemonic "$MNEMONIC" --accountType validator --index $RID > /root/.celo/validator_pkey
            celotooljs.sh generate account-address --private-key `cat /root/.celo/validator_pkey` > /root/.celo/validator_address
            rm -f /root/.celo/validator_pkey
            {{ end }}
            echo -n "Generating IP address for node: "
            if [ -z $IP_ADDRESSES ]; then
              echo 'No $IP_ADDRESSES'
              # to use the IP address of a service from an env var that Kubernetes creates
              SERVICE_ENV_VAR_PREFIX={{ .service_ip_env_var_prefix }}
              if [ "$SERVICE_ENV_VAR_PREFIX" ]; then
                echo -n "Using ${SERVICE_ENV_VAR_PREFIX}${RID}_SERVICE_HOST:"
                SERVICE_IP_ADDR=`eval "echo \\${${SERVICE_ENV_VAR_PREFIX}${RID}_SERVICE_HOST}"`
                echo $SERVICE_IP_ADDR
                echo "$SERVICE_IP_ADDR" > /root/.celo/ipAddress
              else
                echo 'Using POD_IP'
                echo $POD_IP > /root/.celo/ipAddress
              fi
            else
              echo 'Using $IP_ADDRESSES'
              echo $IP_ADDRESSES | cut -d '/' -f $((RID + 1)) > /root/.celo/ipAddress
            fi
            echo "/root/.celo/ipAddress"
            cat /root/.celo/ipAddress

            echo -n "Generating Bootnode enode address for node: "
            celotooljs.sh generate public-key --mnemonic "$MNEMONIC" --accountType bootnode --index 0 > /root/.celo/bootnodeEnodeAddress

            cat /root/.celo/bootnodeEnodeAddress
            [[ "$BOOTNODE_IP_ADDRESS" == 'none' ]] && BOOTNODE_IP_ADDRESS=${{ .Release.Namespace | upper }}_BOOTNODE_SERVICE_HOST

            echo `cat /root/.celo/bootnodeEnodeAddress`@$BOOTNODE_IP_ADDRESS:30301 > /root/.celo/bootnodeEnode
            echo -n "Generating Bootnode enode for tx node: "
            cat /root/.celo/bootnodeEnode
        env:
        - name: POD_IP
          valueFrom:
            fieldRef:
              apiVersion: v1
              fieldPath: status.podIP
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
{{ if .unlock | default false }}
{{ include "common.import-geth-account-container" .  | indent 6 }}
{{ end }}
      containers:
      - name: geth
        image: {{ .Values.geth.image.repository }}:{{ .Values.geth.image.tag }}
        imagePullPolicy: Always
        command: ["/bin/sh"]
        args:
        - "-c"
        - |-
          set -euo pipefail
          ACCOUNT_ADDRESS=$(cat /root/.celo/address)
          NAT_FLAG="--nat=extip:$(cat /root/.celo/ipAddress)"
          PING_IP_FROM_PACKET_FLAG=""
          [[ "$PING_IP_FROM_PACKET" == "true" ]] && PING_IP_FROM_PACKET_FLAG="--ping-ip-from-packet"
          IN_MEMORY_DISCOVERY_TABLE_FLAG=""
          [[ "$IN_MEMORY_DISCOVERY_TABLE" == "true" ]] && IN_MEMORY_DISCOVERY_TABLE_FLAG="--use-in-memory-discovery-table"
          PROXY_ALLOW_PRIVATE_IP_FLAG=""
          [[ "$GETH_DEBUG" == "true" ]] && PROXY_ALLOW_PRIVATE_IP_FLAG="--proxy.allowprivateip"

          RPC_APIS={{ .rpc_apis }}

          ADDITIONAL_FLAGS=""
          {{ if .proxy }}
          VALIDATOR_HEX_ADDRESS=`cat /root/.celo/validator_address`
          ADDITIONAL_FLAGS="--proxy.proxiedvalidatoraddress $VALIDATOR_HEX_ADDRESS --proxy.proxy --proxy.internalendpoint :30503 $PROXY_ALLOW_PRIVATE_IP_FLAG"
          {{ end }}
          {{ if .unlock | default false }}
          ADDITIONAL_FLAGS="${ADDITIONAL_FLAGS} --unlock=${ACCOUNT_ADDRESS} --password /root/.celo/account/accountSecret --allow-insecure-unlock"
          {{ end }}
          {{ if .expose }}
          ADDITIONAL_FLAGS="${ADDITIONAL_FLAGS} --rpc --rpcaddr 0.0.0.0 --rpcapi=${RPC_APIS} --rpccorsdomain='*' --rpcvhosts=* --ws --wsaddr 0.0.0.0 --wsorigins=* --wsapi=${RPC_APIS}"
          {{ end }}

          geth \
            --bootnodes=enode://`cat /root/.celo/bootnodeEnode` \
            --light.serve 90 \
            --light.maxpeers 1000 \
            --maxpeers 1100 \
            --rpc \
            --rpcaddr 0.0.0.0 \
            --rpcapi=${RPC_APIS} \
            --rpccorsdomain='*' \
            --rpcvhosts=* \
            --ws \
            --wsaddr 0.0.0.0 \
            --wsorigins=* \
            --wsapi=${RPC_APIS} \
            --nodekey=/root/.celo/pkey \
            --etherbase=${ACCOUNT_ADDRESS} \
            --networkid=${NETWORK_ID} \
            --syncmode=full \
            --gcmode={{ .gcmode | default "full" }} \
            ${NAT_FLAG} \
            --ethstats=${HOSTNAME}@${ETHSTATS_SVC} \
            --consoleformat=json \
            --consoleoutput=stdout \
            --verbosity={{ .Values.geth.verbosity }} \
            --metrics \
            ${PING_IP_FROM_PACKET_FLAG} \
            ${IN_MEMORY_DISCOVERY_TABLE_FLAG} \
            ${ADDITIONAL_FLAGS}
        env:
        - name: ETHSTATS_SVC
          value: {{ template "ethereum.fullname" . }}-ethstats.{{ .Release.Namespace }}
        - name: GETH_DEBUG
          value: "{{ default "false" .Values.geth.debug }}"
        - name: NETWORK_ID
          valueFrom:
            configMapKeyRef:
              name: {{ template "ethereum.fullname" . }}-geth-config
              key: networkid
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
        {{ if .proxy }}
        - name: proxy-udp
          containerPort: 30503
          protocol: UDP
        - name: proxy-tcp
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
