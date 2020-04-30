{{- define "common.init-genesis-container" -}}
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

{{- define "common.import-geth-account-container" -}}
- name: import-geth-account
  image: {{ .Values.geth.image.repository }}:{{ .Values.geth.image.tag }}
  imagePullPolicy: {{ .Values.imagePullPolicy }}
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
