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
          --password=/root/.celo/account/accountSecret \
          --nodekey=/root/.celo/account/{{ .Node.name}}PrivateKey \
          --unlock=${ACCOUNT_ADDRESS} \
          --mine \
          --rpc \
          --rpcaddr 0.0.0.0 \
          --rpcapi=eth,net,web3,debug \
          --rpccorsdomain='*' \
          --rpcvhosts=* \
          --ws \
          --wsaddr 0.0.0.0 \
          --wsorigins=* \
          --wsapi=eth,net,web3,debug \
          --etherbase=${ACCOUNT_ADDRESS} \
          --networkid=${NETWORK_ID} \
          --miner.verificationpool=${VERIFICATION_POOL_URL} \
          --syncmode=full \
          --ethstats=${HOSTNAME}:${ETHSTATS_SECRET}@${ETHSTATS_SVC} \
          --consoleformat=json \
          --consoleoutput=stdout \
          --verbosity={{ .Values.geth.verbosity }} \
          --metrics"
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
          --lightserv 90 \
          --lightpeers 250 \
          --networkid=${NETWORK_ID} \
          --ethstats=${HOSTNAME}:${ETHSTATS_SECRET}@${ETHSTATS_SVC} \
          --consoleformat=json \
          --consoleoutput=stdout \
          --verbosity={{ .Values.geth.verbosity }} \
          --metrics \
          --targetgaslimit=${TARGET_GAS_LIMIT} \
          --rpc \
          --rpcaddr 0.0.0.0 \
          --rpcapi=eth,net,web3,debug \
          --rpccorsdomain='*' \
          --rpcvhosts=* \
          --ws \
          --wsaddr 0.0.0.0 \
          --wsorigins=* \
          --wsapi=eth,net,web3,debug \
          --nodekey=/root/.celo/account/{{ .node_name }}NodeKey"
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
