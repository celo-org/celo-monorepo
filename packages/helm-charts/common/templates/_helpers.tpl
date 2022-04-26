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

{{- define "common.conditional-init-genesis-container" -}}
{{- $production_envs := list "rc1" "baklava" "alfajores" -}}
{{- if not (has .Values.genesis.network $production_envs) -}}
{{ include "common.init-genesis-container" . }}
{{- end -}}
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
      mkdir -p /var/geth /root/.celo
      if [ "{{ .Values.genesis.useGenesisFileBase64 | default false }}" == "true" ]; then
        cp -L /var/geth/genesis.json /root/.celo/
      else
        wget -O /root/.celo/genesis.json "https://www.googleapis.com/storage/v1/b/genesis_blocks/o/{{ .Values.genesis.network }}?alt=media"
        wget -O /root/.celo/bootnodeEnode https://storage.googleapis.com/env_bootnodes/{{ .Values.genesis.network }}
      fi
      # There are issues with running geth init over existing chaindata around the use of forks.
      # The case that this could cause problems is when a network is set up with Base64 genesis files & chaindata
      # as that could interfere with accessing bootnodes for newly created nodes.
      if [ "{{ .Values.geth.use_gstorage_data | default false }}" == "false" ]; then
        geth init /root/.celo/genesis.json
      fi
  volumeMounts:
  - name: data
    mountPath: /root/.celo
  {{- if eq (default .Values.genesis.useGenesisFileBase64 "false") "true" }}
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

{{- define "common.bootnode-flag-script" }}
if [[ "{{ .Values.genesis.network }}" == "alfajores" || "{{ .Values.genesis.network }}" == "baklava" ]]; then
  BOOTNODE_FLAG="--{{ .Values.genesis.network }}"
else
  [ -f /root/.celo/bootnodeEnode ] && BOOTNODE_FLAG="--bootnodes=$(cat /root/.celo/bootnodeEnode) --networkid={{ .Values.genesis.networkId }}"
fi
{{- end }}

{{- define "common.full-node-container" }}
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
    NAT_FLAG=""
    if [[ ! -z $IP_ADDRESSES ]]; then
      NAT_IP=$(echo "$IP_ADDRESSES" | awk -v RID=$(expr "$RID" + "1") '{split($0,a,","); print a[RID]}')
    else
      NAT_IP=$(cat /root/.celo/ipAddress)
    fi
    NAT_FLAG="--nat=extip:${NAT_IP}"

    ADDITIONAL_FLAGS='{{ .geth_flags | default "" }}'
    if [[ -f /root/.celo/pkey ]]; then
      NODE_KEY=$(cat /root/.celo/pkey)
      if [[ ! -z ${NODE_KEY} ]]; then
        ADDITIONAL_FLAGS="${ADDITIONAL_FLAGS} --nodekey=/root/.celo/pkey"
      fi
    fi
    {{- if .proxy | default false }}
    VALIDATOR_HEX_ADDRESS=$(cat /root/.celo/validator_address)
    ADDITIONAL_FLAGS="${ADDITIONAL_FLAGS} --proxy.proxiedvalidatoraddress $VALIDATOR_HEX_ADDRESS --proxy.proxy --proxy.internalendpoint :30503"
    {{- end }}

    {{- if .proxied | default false }}
    ADDITIONAL_FLAGS="${ADDITIONAL_FLAGS} --proxy.proxiedvalidatoraddress $VALIDATOR_HEX_ADDRESS --proxy.proxy --proxy.internalendpoint :30503"
    {{- end }}
    {{- if .unlock | default false }}
    ACCOUNT_ADDRESS=$(cat /root/.celo/address)
    ADDITIONAL_FLAGS="${ADDITIONAL_FLAGS} --unlock=${ACCOUNT_ADDRESS} --password /root/.celo/account/accountSecret --allow-insecure-unlock"
    {{- end }}
    {{- if .expose }}
    {{- include  "common.geth-http-ws-flags" (dict "Values" $.Values "rpc_apis" (default "eth,net,web3,debug,txpool" .rpc_apis) "ws_port" (default .Values.geth.ws_port .ws_port ) "listen_address" "0.0.0.0") | nindent 4 }}
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
    {{- if .ethstats | default false }}
    ACCOUNT_ADDRESS=$(cat /root/.celo/address)
    if grep -nri ${ACCOUNT_ADDRESS#0x} /root/.celo/keystore/ > /dev/null; then
      :
    {{- if .proxy | default false }}
      ADDITIONAL_FLAGS="${ADDITIONAL_FLAGS} --etherbase=${ACCOUNT_ADDRESS}"
      [[ "$RID" -eq 0 ]] && ADDITIONAL_FLAGS="${ADDITIONAL_FLAGS} --ethstats=${HOSTNAME}@{{ .ethstats }}"
    {{- else }}
    {{- if not (.proxied | default false) }}
      ADDITIONAL_FLAGS="${ADDITIONAL_FLAGS} --ethstats=${HOSTNAME}@{{ .ethstats }}"
    {{- end }}
    {{- end }}
    fi
    {{- end }}

    {{- include  "common.geth-add-metrics-pprof-config" . | nindent 4 }}

    PORT=30303

    {{- if .ports }}
    PORTS_PER_RID={{ join "," .ports }}
    PORT=$(echo $PORTS_PER_RID | cut -d ',' -f $((RID + 1)))
    {{- end }}

    {{- include  "common.bootnode-flag-script" . | nindent 4 }}

    {{ default "# No extra setup" .extra_setup | nindent 4 | trim }}

    exec geth \
      --port $PORT \
    {{- if not (contains "rc1" .Values.genesis.network) }}
      $BOOTNODE_FLAG \
    {{- end }}
      --light.serve={{- if kindIs "invalid" .light_serve -}}90{{- else -}}{{- .light_serve -}}{{- end }} \
      --light.maxpeers={{- if kindIs "invalid" .light_maxpeers -}}1000{{- else -}}{{- .light_maxpeers -}}{{- end }} \
      --maxpeers={{- if kindIs "invalid" .maxpeers -}}1200{{- else -}}{{- .maxpeers -}}{{- end }} \
      --nousb \
      --syncmode={{ .syncmode | default .Values.geth.syncmode }} \
      --gcmode={{ .gcmode | default .Values.geth.gcmode }} \
      ${NAT_FLAG} \
      --consoleformat=json \
      --consoleoutput=stdout \
      --verbosity={{ .Values.geth.verbosity }} \
      --vmodule={{ .Values.geth.vmodule }} \
      --datadir=/root/.celo \
      --ipcpath=geth.ipc \
      --txlookuplimit {{ .Values.geth.txlookuplimit | default 0 }} \
      ${ADDITIONAL_FLAGS}
  env:
  - name: GETH_DEBUG
    value: "{{ default "false" .Values.geth.debug }}"
  - name: NETWORK_ID
    value: "{{ .Values.genesis.networkId }}"
  - name: IP_ADDRESSES
    value: "{{ join "," .ip_addresses }}"
  - name: REPLICA_NAME
    valueFrom:
      fieldRef:
        fieldPath: metadata.name
{{- if .Values.aws }}
  - name: HOST_IP
    valueFrom:
      fieldRef:
        fieldPath: status.hostIP
{{- end }}
{{ include  "common.geth-prestop-hook" . | indent 2 -}}
{{/* TODO: make this use IPC */}}
{{- if .expose }}
  readinessProbe:
    exec:
      command:
      - /bin/sh
      - "-c"
      - |
{{ include "common.node-health-check" (dict "maxpeers" .maxpeers "light_maxpeers" .light_maxpeers ) | indent 8 }}
    initialDelaySeconds: 20
    periodSeconds: 10
{{- end }}
  ports:
{{- if .ports }}
{{- range $index, $port := .ports }}
  - name: discovery-{{ $port }}
    containerPort: {{ $port }}
    protocol: UDP
  - name: ethereum-{{ $port }}
    containerPort: {{ $port }}
{{- end }}
{{- else }}
  - name: discovery
    containerPort: 30303
    protocol: UDP
  - name: ethereum
    containerPort: 30303
{{- end }}
{{- if .expose }}
  - name: rpc
    containerPort: 8545
  - name: ws
    containerPort: {{ default .Values.geth.ws_port .ws_port }}
{{ end }}
{{- if .pprof }}
  - name: pprof
    containerPort: {{ .pprof_port }}
{{ end }}
  resources:
{{ toYaml .Values.geth.resources | indent 4 }}
  volumeMounts:
  - name: data
    mountPath: /root/.celo
{{- if .ethstats }}
  - name: account
    mountPath: /root/.celo/account
    readOnly: true
{{- end }}
{{- end }}

{{- define "common.geth-prestop-hook" }}
lifecycle:
  preStop:
    exec:
      command: ["/bin/sh","-c","killall -SIGTERM geth; while killall -0 geth; do sleep 1; done"]
{{- end }}

{{- define "common.geth-configmap" -}}
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ template "common.fullname" . }}-geth-config
  labels:
{{ include "common.standard.labels" .  | indent 4 }}
data:
  networkid: {{ $.Values.genesis.networkId | quote }}
{{- if eq (default $.Values.genesis.useGenesisFileBase64 "false") "true" }}
  genesis.json: {{ $.Values.genesis.genesisFileBase64 | b64dec | quote }}
{{- end -}}
{{- end -}}

{{- define "common.celotool-full-node-statefulset-container" -}}
- name: get-account
  image: {{ .Values.celotool.image.repository }}:{{ .Values.celotool.image.tag }}
  imagePullPolicy: {{ .Values.celotool.image.imagePullPolicy }}
  command:
    - bash
    - "-c"
    - |
      [[ $REPLICA_NAME =~ -([0-9]+)$ ]] || exit 1
      RID=${BASH_REMATCH[1]}
      {{ if .proxy }}
      # To allow proxies to scale up easily without conflicting with keys of
      # proxies associated with other validators
      KEY_INDEX=$(( ({{ .validator_index }} * 10000) + $RID ))
      echo {{ .validator_index }} > /root/.celo/validator_index
      {{ else }}
      KEY_INDEX=$RID
      {{ end }}
      echo "Generating private key with KEY_INDEX=$KEY_INDEX"
      celotooljs.sh generate bip32 --mnemonic "$MNEMONIC" --accountType {{ .mnemonic_account_type }} --index $KEY_INDEX > /root/.celo/pkey
      echo "Private key $(cat /root/.celo/pkey)"
      echo 'Generating address'
      celotooljs.sh generate account-address --private-key $(cat /root/.celo/pkey) > /root/.celo/address
      {{ if .proxy }}
      # Generating the account address of the validator
      echo "Generating the account address of the validator {{ .validator_index }}"
      celotooljs.sh generate bip32 --mnemonic "$MNEMONIC" --accountType validator --index {{ .validator_index }} > /root/.celo/validator_pkey
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

      echo "enode://$(cat /root/.celo/bootnodeEnodeAddress)@$BOOTNODE_IP_ADDRESS:30301" > /root/.celo/bootnodeEnode
      echo -n "Generating Bootnode enode for tx node: "
      cat /root/.celo/bootnodeEnode
  env:
  - name: POD_IP
    valueFrom:
      fieldRef:
        apiVersion: v1
        fieldPath: status.podIP
  - name: BOOTNODE_IP_ADDRESS
    value: {{ default "none" .Values.geth.bootnodeIpAddress }}
  - name: REPLICA_NAME
    valueFrom:
      fieldRef:
        fieldPath: metadata.name
  - name: MNEMONIC
    valueFrom:
      secretKeyRef:
        name: {{ template "common.fullname" . }}-geth-account
        key: mnemonic
  - name: IP_ADDRESSES
    value: {{ .ip_addresses }}
  volumeMounts:
  - name: data
    mountPath: /root/.celo
{{- end -}}

{{- define "common.node-health-check" -}}
function isReady {
  geth attach << EOF

    // Deployment configuration
    var maxpeers = {{ required "maxpeers is required" .maxpeers }}
    var lightpeers = {{ required "light_maxpeers is required"  .light_maxpeers }}

    // minimum peers to consider eth_syncing a good indicator for considering low chances of new block on chain
    // With current dial ratio a node will try to open connections to (maxpeers - lightpeers)/3 peers.
    // Consider 1/5 of (maxpeers - lightpeers) as reference value for peers, with a minimum of 5.
    var minPeers = (maxpeers - lightpeers) * 0.2
    if (minPeers > 30) {
      minPeers = 30
    } else if (minPeers < 5) {
      minPeers = 5
    }

    // last block max age in seconds
    var maxAge = 20

    // getLastBlockAge() returns chain lastBlock age in seconds
    function getLastBlockAge() {
      var lastBlock = web3.eth.getBlockByNumber(web3.eth.blockNumber)
      var blockTimestamp = parseInt(lastBlock.timestamp, 16)
      var now = Math.floor(Date.now() / 1000)
      return (now - blockTimestamp)
    }

    // isReady() determines if the node is ready to handle requests
    // Prints 'CELO BLOCKCHAIN IS READY' if the node is ready
    function isReady(maxAge, minPeers) {
      // If block was produced recently -> node is ready
      if (getLastBlockAge() <= maxAge) {
        return true
      }
      // First let's check if it's syncing. If node is syncing -> there is
      // peers with blocks ahead from local head -> not ready
      if (web3.eth.syncing) {
          return false
      }
      // If node is not syncing, lets check the peers
      if (web3.net.peerCount < minPeers) {
          // Not enough peers -> Node may have just started -> Not ready
          return false
      }
      // If peers > minPeers and not syncing -> We consider node as ready
      return true
    }

    if(isReady(maxAge, minPeers)) {
      console.log('CELO BLOCKCHAIN IS READY')
    }
EOF
}

# Check if scripts prints 'CELO BLOCKCHAIN IS READY' as readiness signal
isReady | grep 'CELO BLOCKCHAIN IS READY'
{{- end }}

{{- define "common.geth-exporter-container" -}}
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

{{- /* This template does not define ports that will be exposed */ -}}
{{- define "common.full-node-service-no-ports" -}}
kind: Service
apiVersion: v1
metadata:
  name: {{ template "common.fullname" $ }}-{{ .svc_name | default .node_name }}-{{ .index }}{{ .svc_name_suffix | default "" }}
  labels:
{{ include "common.standard.labels" .  | indent 4 }}
    component: {{ .component_label }}
spec:
  selector:
    app: {{ template "common.name" $ }}
    release: {{ $.Release.Name }}
    component: {{ .component_label }}
{{ if .extra_selector -}}
{{ .extra_selector | indent 4}}
{{- end }}
    statefulset.kubernetes.io/pod-name: {{ template "common.fullname" $ }}-{{ .node_name }}-{{ .index }}
  type: {{ .service_type }}
{{- if .load_balancer_ip }}
  loadBalancerIP: {{ .load_balancer_ip }}
{{- end }}
{{- end -}}

{{/*
* Specifies an env var given a dictionary, the name of the desired value, and
* if it's optional. If optional, the env var is only given if the desired value exists in the dict.
*/}}
{{- define "common.env-var" -}}
{{- if or (not .optional) (hasKey .dict .value_name) }}
- name: {{ .name }}
  value: "{{ (index .dict .value_name) }}"
{{- end }}
{{- end -}}

{{/*
Annotations to indicate to the prometheus server that this node should be scraped for metrics
*/}}
{{- define "common.prometheus-annotations" -}}
{{- $pprof := .Values.pprof | default dict -}}
prometheus.io/scrape: "true"
prometheus.io/path:  "{{ $pprof.path | default "/debug/metrics/prometheus" }}"
prometheus.io/port: "{{ $pprof.port | default 6060 }}"
{{- end -}}

{{- define "common.remove-old-chaindata" -}}
- name: remove-old-chaindata
  image: {{ .Values.geth.image.repository }}:{{ .Values.geth.image.tag }}
  imagePullPolicy: {{ .Values.geth.image.imagePullPolicy }}
  command: ["/bin/sh"]
  args:
  - "-c"
  - |
    if [ -d /root/.celo/celo/chaindata ]; then
      lastBlockTimestamp=$(timeout 600 geth console --maxpeers 0 --light.maxpeers 0 --syncmode full --txpool.nolocals --exec "eth.getBlock(\"latest\").timestamp")
      day=$(date +%s)
      diff=$(($day - $lastBlockTimestamp))
      # If lastBlockTimestamp is older than 20 day old, pull the chaindata rather than using the current PVC.
      if [ "$diff" -gt 1728000 ]; then
        echo Chaindata is more than one day out of date. Wiping existing chaindata.
        rm -rf /root/.celo/celo/chaindata
      else
        echo Chaindata is less than one day out of date. Using existing chaindata.
      fi
    else
      echo No chaindata at all.
    fi
  volumeMounts:
  - name: data
    mountPath: /root/.celo
{{- end -}}

{{- /* Needs a serviceAccountName in the pod with permissions to access gstorage */ -}}
{{- define "common.gsutil-sync-data-init-container" -}}
- name: gsutil-sync-data
  image: gcr.io/google.com/cloudsdktool/cloud-sdk:latest
  imagePullPolicy: IfNotPresent
  command:
  - /bin/sh
  - -c
  args:
  - |
     if [ -d /root/.celo/celo/chaindata ]; then
       echo Using pre-existing chaindata
       exit 0
     fi
     mkdir -p /root/.celo/celo
     gsutil -m cp -r gs://{{ .Values.geth.gstorage_data_bucket }}/chaindata-latest.tar.gz chaindata.tar.gz
     tar -xzvf chaindata.tar.gz -C /root/.celo/celo
     rm chaindata.tar.gz
  volumeMounts:
  - name: data
    mountPath: /root/.celo
{{- end -}}

{{- define "common.geth-add-metrics-pprof-config" }}

{{- if .metrics | default true }}
ADDITIONAL_FLAGS="${ADDITIONAL_FLAGS} --metrics"
{{- end }}
{{- if (or .Values.metrics .Values.pprof.enabled) | default false }}
# Check the format of pprof cmd arguments
set +e
geth --help | grep 'pprof.port' >/dev/null
pprof_new_format=$?
set -e
if [ $pprof_new_format -eq 0 ]; then
  ADDITIONAL_FLAGS="${ADDITIONAL_FLAGS} --pprof --pprof.port {{ .Values.pprof.port | default "6060" }} --pprof.addr 0.0.0.0"
else
  ADDITIONAL_FLAGS="${ADDITIONAL_FLAGS} --pprof --pprofport {{ .Values.pprof.port | default "6060" }} --pprofaddr 0.0.0.0"
fi
{{- end }}
{{- end }}

{{- define "common.geth-http-ws-flags" }}

# Check the format of http/rcp and ws cmd arguments
RPC_APIS={{ .rpc_apis | default "eth,net,web3,debug" | quote }}
WS_PORT="{{ .ws_port | default 8545 }}"
LISTEN_ADDRESS={{ .listen_address | default "0.0.0.0" | quote }}
set +e
geth --help | grep 'http.addr' >/dev/null
http_new_format=$?
set -e
if [ $http_new_format -eq 0 ]; then
  ADDITIONAL_FLAGS="${ADDITIONAL_FLAGS} --http --http.addr $LISTEN_ADDRESS --http.api=$RPC_APIS --http.corsdomain='*' --http.vhosts=*"
  ADDITIONAL_FLAGS="${ADDITIONAL_FLAGS} --ws --ws.addr $LISTEN_ADDRESS --ws.origins=* --ws.api=$RPC_APIS --ws.port=$WS_PORT --ws.rpcprefix=/"
else
  ADDITIONAL_FLAGS="${ADDITIONAL_FLAGS} --rpc --rpcaddr $LISTEN_ADDRESS --rpcapi=$RPC_APIS --rpccorsdomain='*' --rpcvhosts=*"
  ADDITIONAL_FLAGS="${ADDITIONAL_FLAGS} --ws --wsaddr $LISTEN_ADDRESS --wsorigins=* --wsapi=$RPC_APIS --wsport=$WS_PORT"
fi
{{- end }}
