{{- define "celo.blockscout-db-sidecar" -}}
- name: cloudsql-proxy
  image: gcr.io/cloudsql-docker/gce-proxy:1.11
  command: ["/cloud_sql_proxy",
            "-instances={{ .Values.blockscout.db.connection_name }}=tcp:5432",
            "-credential_file=/secrets/cloudsql/credentials.json"]
  securityContext:
    runAsUser: 2  # non-root user
    allowPrivilegeEscalation: false
  volumeMounts:
    - name: blockscout-cloudsql-credentials
      mountPath: /secrets/cloudsql
      readOnly: true
volumes:
  - name: blockscout-cloudsql-credentials
    secret:
      secretName: blockscout-cloudsql-credentials
{{- end -}}

{{- define "celo.blockscout-env-vars" -}}
- name: DATABASE_USER
  valueFrom:
    secretKeyRef:
      name:  {{ .Release.Name }}
      key: DATABASE_USER
- name: DATABASE_PASSWORD
  valueFrom:
    secretKeyRef:
      name:  {{ .Release.Name }}
      key: DATABASE_PASSWORD
- name: NETWORK
  value: Celo
- name: SUBNETWORK
  value: {{ .Values.blockscout.subnetwork }}
- name: COIN
  value: cGLD
- name: ECTO_USE_SSL
  value: "false"
- name: ETHEREUM_JSONRPC_VARIANT
  value: geth
- name: ETHEREUM_JSONRPC_HTTP_URL
  value: {{ .Values.blockscout.jsonrpc_http_url }}
- name: ETHEREUM_JSONRPC_WS_URL
  value: {{ .Values.blockscout.jsonrpc_ws_url }}
- name: DATABASE_URL
  value: postgres://$(DATABASE_USER):$(DATABASE_PASSWORD)@127.0.0.1:5432/{{ .Values.blockscout.db.name }}
- name: DATABASE_DB
  value: {{ .Values.blockscout.db.name }}
- name: DATABASE_HOSTNAME
  value: "127.0.0.1"
- name: DATABASE_PORT
  value: "5432"
- name: MIX_ENV
  value: prod
- name: LOGO
  value: /images/celo_logo.svg
- name: BLOCKSCOUT_VERSION
  value: {{ .Values.blockscout.image.tag }}
{{- end -}}
