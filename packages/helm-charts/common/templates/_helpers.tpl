{{/* vim: set filetype=mustache: */}}
 {{/*
Expand the name of the chart.
*/}}
{{- define "common.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "common.fullname" -}}
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

{{- define "common.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "common.standard.labels" -}}
{{- include "common.standard.short_labels" . }}
chart: {{ template "common.chart" . }}
heritage: {{ .Release.Service }}
{{- end -}}

{{- define "common.standard.short_labels" -}}
app: {{ template "common.name" . }}
release: {{ .Release.Name }}
{{- end -}}

{{- define "common.init-genesis-container" -}}
- name: init-genesis
  image: {{ .Values.geth.image.repository }}:{{ .Values.geth.image.tag }}
  imagePullPolicy: {{ .Values.geth.image.imagePullPolicy }}
  command:
  - /bin/sh
  - -c
  args:
  - |
      mkdir -p /var/geth /root/celo
      if [ "{{ .Values.genesis.useGenesisFileBase64 | default false }}" == "true" ]; then
        cp -rp /var/geth/genesis.json /root/.celo/
        cp -rp /var/geth/bootnodeEnode /root/.celo/
      else
        wget -O /root/.celo/genesis.json "https://www.googleapis.com/storage/v1/b/genesis_blocks/o/{{ .Values.genesis.network }}?alt=media"
        wget -O /root/.celo/bootnodeEnode https://storage.googleapis.com/env_bootnodes/{{ .Values.genesis.network }}
      fi
      geth init /root/.celo/genesis.json
  volumeMounts:
  - name: data
    mountPath: /root/.celo
  {{- if .Values.genesis.useGenesisFileBase64 }}
  - name: config
    mountPath: /var/geth
  {{ end -}}
{{- end -}}

{{- define "common.import-geth-account-container" -}}
- name: import-geth-account
  image: {{ .Values.geth.image.repository }}:{{ .Values.geth.image.tag }}
  imagePullPolicy: {{ .Values.geth.image.imagePullPolicy }}
  command: ["/bin/sh"]
  args:
  - "-c"
  - |
    geth account import --password /root/.celo/account/accountSecret /root/.celo/pkey || true
  volumeMounts:
  - name: data
    mountPath: /root/.celo
  - name: account
    mountPath: "/root/.celo/account"
    readOnly: true
{{- end -}}

{{- define "common.full-node-container" -}}
- name: geth
  image: {{ .Values.geth.image.repository }}:{{ .Values.geth.image.tag }}
  imagePullPolicy: {{ .Values.geth.image.imagePullPolicy }}
  command:
  - /bin/sh
  - -c
  args:
  - |
    set -euo pipefail
    RID=$(echo $REPLICA_NAME | grep -Eo '[0-9]+$')
    public_ip=$(echo "$PUBLIC_IPS" | awk -v RID=$(expr "$RID" + "1") '{split($0,a,","); print a[RID]}')
    NAT_FLAG="--nat=extip:${public_ip}"

    ADDITIONAL_FLAGS='{{ .geth_flags | default "" }}'
    {{ if .proxy }}
    VALIDATOR_HEX_ADDRESS=$(cat /root/.celo/validator_address)
    ADDITIONAL_FLAGS="--proxy.proxiedvalidatoraddress $VALIDATOR_HEX_ADDRESS --proxy.proxy --proxy.internalendpoint :30503 $PROXY_ALLOW_PRIVATE_IP_FLAG"
    {{ end }}
    {{- if .unlock | default false }}
    ADDITIONAL_FLAGS="${ADDITIONAL_FLAGS} --unlock=${ACCOUNT_ADDRESS} --password /root/.celo/account/accountSecret --allow-insecure-unlock"
    {{- end }}
    {{- if .expose }}
    RPC_APIS="{{ .rpc_apis | default "eth,net,web3,debug,txpool" }}"
    ADDITIONAL_FLAGS="${ADDITIONAL_FLAGS} --rpc --rpcaddr 0.0.0.0 --rpcapi=${RPC_APIS} --rpccorsdomain='*' --rpcvhosts=* --ws --wsaddr 0.0.0.0 --wsorigins=* --wsapi=${RPC_APIS}"
    {{- end }}
    {{- if .ping_ip_from_packet | default false }}
    ADDITIONAL_FLAGS="${ADDITIONAL_FLAGS} --ping-ip-from-packet"
    {{- end }}
    {{- if .in_memory_discovery_table_flag | default false }}
    ADDITIONAL_FLAGS="${ADDITIONAL_FLAGS} --use-in-memory-discovery-table"
    {{- end }}
    {{- if .proxy_allow_private_ip_flag | default false }}
    ADDITIONAL_FLAGS="${ADDITIONAL_FLAGS} --proxy.allowprivateip"
    {{- end }}
  
    geth \
      --bootnodes=$(cat /root/.celo/bootnodeEnode) \
      --light.serve {{ .light_serve | default 90 }} \
      --light.maxpeers {{ .light_maxpeers | default 1000 }} \
      --maxpeers {{ .maxpeers | default 1100 }} \
      --networkid=${NETWORK_ID} \
      --syncmode={{ .Values.geth.syncmode }} \
      --gcmode={{ .Values.geth.gcmode }} \
      ${NAT_FLAG} \
      --consoleformat=json \
      --consoleoutput=stdout \
      --verbosity={{ .Values.geth.verbosity }} \
      --metrics \
      ${ADDITIONAL_FLAGS}
  env:
  - name: GETH_DEBUG
    value: "{{ default "false" .Values.geth.debug }}"
  - name: NETWORK_ID
    value: "{{ .Values.genesis.networkId }}"
  - name: PUBLIC_IPS
    value: "{{ join "," .Values.geth.public_ips }}"
  - name: REPLICA_NAME
    valueFrom:
      fieldRef:
        fieldPath: metadata.name
  ports:
  - name: discovery
    containerPort: 30303
    protocol: UDP
  - name: ethereum
    containerPort: 30303
{{- if .expose }}
  - name: rpc
    containerPort: 8545
  - name: ws
    containerPort: 8546
{{ end }}
  resources:
{{ toYaml .Values.geth.resources | indent 4 }}
  volumeMounts:
  - name: data
    mountPath: /root/.celo
volumes:
- name: data
  emptyDir: {}
{{- end -}}

{{- define "common.geth-configmap" -}}
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ template "common.fullname" . }}-geth-config
  labels:
{{ include "standard.labels" .  | indent 4 }}
data:
  networkid: {{ .Values.genesis.networkId | quote }}
  genesis.json: {{ .Values.genesis.fileBase64 | b64dec | quote }}
{{- end -}}
