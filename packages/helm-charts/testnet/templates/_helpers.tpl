{{/* vim: set filetype=mustache: */}}

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

{{- /* This template does not define ports that will be exposed */ -}}
{{- define "celo.node-service" -}}
kind: Service
apiVersion: v1
metadata:
  name: {{ template "common.fullname" $ }}-{{ .svc_name | default .node_name }}-{{ .index }}{{ .svc_name_suffix | default "" }}
  labels:
{{ include "common.standard.labels" .  | indent 4 }}
    component: {{ .component_label }}
spec:
  selector:
    statefulset.kubernetes.io/pod-name: {{ template "common.fullname" $ }}-{{ .node_name }}-{{ .index }}
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
{{ if .proxy | default false }}
{{ $validatorProxied := printf "%s-validators-%d" .Release.Namespace .validator_index }}
    validator-proxied: "{{ $validatorProxied }}"
{{- end }}
    component: {{ .component_label }}
spec:
  sessionAffinity: ClientIP
  ports:
  - port: 30303
    name: ethereum
  - port: 8545
    name: rpc
  - port: 8546
    name: ws
  selector:
{{ if .proxy | default false }}
{{ $validatorProxied := printf "%s-validators-%d" .Release.Namespace .validator_index }}
    validator-proxied: "{{ $validatorProxied }}"
{{- end }}
    component: {{ .component_label }}
---
apiVersion: apps/v1beta2
kind: StatefulSet
metadata:
  name: {{ template "common.fullname" . }}-{{ .name }}
  labels:
{{ include "common.standard.labels" .  | indent 4 }}
    component: {{ .component_label }}
{{ if .proxy | default false }}
{{ $validatorProxied := printf "%s-validators-%d" .Release.Namespace .validator_index }}
    validator-proxied: "{{ $validatorProxied }}"
{{- end }}
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
          storage: {{ .Values.geth.diskSizeGB }}Gi
  {{ end }}
  podManagementPolicy: Parallel
  replicas: {{ .replicas }}
  serviceName: {{ .name }}
  selector:
    matchLabels:
{{ include "common.standard.labels" .  | indent 6 }}
      component: {{ .component_label }}
{{ if .proxy | default false }}
{{ $validatorProxied := printf "%s-validators-%d" .Release.Namespace .validator_index }}
      validator-proxied: "{{ $validatorProxied }}"
{{- end }}
  template:
    metadata:
      labels:
{{ include "common.standard.labels" .  | indent 8 }}
        component: {{ .component_label }}
{{ if .proxy | default false }}
{{ $validatorProxied := printf "%s-validators-%d" .Release.Namespace .validator_index }}
        validator-proxied: "{{ $validatorProxied }}"
{{- end }}
{{ if .Values.metrics | default false }}
      annotations:
{{ include "common.prometheus-annotations" . | indent 8 }}
{{- end }}
    spec:
      initContainers:
{{ include "common.init-genesis-container" .  | indent 6 }}
{{ include "common.celotool-validator-container" (dict  "Values" .Values "Release" .Release "Chart" .Chart "proxy" .proxy "mnemonic_account_type" .mnemonic_account_type "service_ip_env_var_prefix" .service_ip_env_var_prefix "ip_addresses" .ip_addresses "validator_index" .validator_index) | indent 6 }}
{{ if .unlock | default false }}
{{ include "common.import-geth-account-container" .  | indent 6 }}
{{ end }}
      containers:
{{ include "common.full-node-container" (dict "Values" .Values "Release" .Release "Chart" .Chart "proxy" .proxy "proxy_allow_private_ip_flag" .proxy_allow_private_ip_flag "unlock" .unlock "expose" .expose "syncmode" .syncmode "gcmode" .gcmode "pprof" (or (.Values.metrics) (.Values.pprof.enabled)) "pprof_port" (.Values.pprof.port) "metrics" .Values.metrics "public_ips" .public_ips "ethstats" (printf "%s-ethstats.%s" (include "common.fullname" .) .Release.Namespace))  | indent 6 }}
      volumes:
      - name: data
        emptyDir: {}
      - name: config
        configMap:
          name: {{ template "common.fullname" . }}-geth-config
      - name: account
        secret:
          secretName: {{ template "common.fullname" . }}-geth-account
{{- end -}}

{{- define "celo.wait-bootnode-initcontainer" -}}
- name: wait-to-bootnode
  image: "{{ .Values.celotool.image.repository }}:{{ .Values.celotool.image.tag }}"
  imagePullPolicy: Always
  command:
  - /bin/sh
  - -c
  args:
  - |
     [[ "$BOOTNODE_IP_ADDRESS" == 'none' ]] && BOOTNODE_IP_ADDRESS=${{ .Release.Namespace | upper }}_BOOTNODE_SERVICE_HOST
     until nc -vzuw 3 $BOOTNODE_IP_ADDRESS 30301; do echo "Waiting for myconfig service"; sleep 2; done;
  env:
  - name: BOOTNODE_IP_ADDRESS
  value: {{ default "none" .Values.geth.bootnodeIpAddress  }}
  resources:
    requests:
      memory: 10M
      cpu: 50m
{{- end -}}

{{- /* This template puts a semicolon-separated pair of proxy enodes into $PROXY_ENODE_URL_PAIR. */ -}}
{{- /* I.e <internal enode>;<external enode>. */ -}}
{{- /* Expects env variables MNEMONIC, RID (the validator index), and PROXY_INDEX */ -}}
{{- define "celo.proxyenodeurlpair" -}}
echo "Generating proxy enode url pair for proxy $PROXY_INDEX"
PROXY_INTERNAL_IP_ENV_VAR={{ $.Release.Namespace | upper }}_VALIDATORS_${RID}_PROXY_INTERNAL_${PROXY_INDEX}_SERVICE_HOST
echo "PROXY_INTERNAL_IP_ENV_VAR=$PROXY_INTERNAL_IP_ENV_VAR"
PROXY_INTERNAL_IP=`eval "echo \\${${PROXY_INTERNAL_IP_ENV_VAR}}"`

# If $PROXY_IPS is not empty, then we use the IPs from there. Otherwise,
# we use the IP address of the proxy internal service
if [ ! -z $PROXY_IPS ]; then
  echo "Proxy external IP from PROXY_IPS=$PROXY_IPS: "
  PROXY_EXTERNAL_IP=`echo -n $PROXY_IPS | cut -d '/' -f $((PROXY_INDEX + 1))`
else
  PROXY_EXTERNAL_IP=$PROXY_INTERNAL_IP
fi

echo "Proxy internal IP: $PROXY_INTERNAL_IP"
echo "Proxy external IP: $PROXY_EXTERNAL_IP"

# Proxy key index to allow for a high number of proxies per validator without overlap
PROXY_KEY_INDEX=$(( ($RID * 10000) + $PROXY_INDEX ))
PROXY_ENODE_ADDRESS=`celotooljs.sh generate public-key --mnemonic "$MNEMONIC" --accountType proxy --index $PROXY_KEY_INDEX`
PROXY_INTERNAL_ENODE=enode://${PROXY_ENODE_ADDRESS}@${PROXY_INTERNAL_IP}:30503
PROXY_EXTERNAL_ENODE=enode://${PROXY_ENODE_ADDRESS}@${PROXY_EXTERNAL_IP}:30303

echo "Proxy internal enode: $PROXY_INTERNAL_ENODE"
echo "Proxy external enode: $PROXY_EXTERNAL_ENODE"

PROXY_ENODE_URL_PAIR=$PROXY_INTERNAL_ENODE\;$PROXY_EXTERNAL_ENODE
{{- end -}}

{{- define "celo.proxyipaddresses" -}}
{{- if .Values.geth.static_ips -}}
{{- index .Values.geth.proxyIPAddressesPerValidatorArray .validatorIndex -}}
{{- end -}}
{{- end -}}
