#!/usr/bin/env bash
set -euo pipefail

echo "=== Paso 1: Añadiendo repos y actualizando ==="
helm repo add nfs-server https://charts.helm.sh/stable
helm repo update

echo "=== Paso 2: Instalando NFS Server Provisioner (RWX interno) ==="
helm upgrade --install nfs-server nfs-server/nfs-server-provisioner \
  --set persistence.enabled=true \
  --set persistence.size=5Gi \
  --set storageClass.name=nfs-rwx \
  --set storageClass.defaultClass=false

echo "Esperando a que el NFS provisioner esté listo..."

# Espera a que el StatefulSet llegue a READY = 1/1
kubectl rollout status statefulset/nfs-server-nfs-server-provisioner --timeout=120s

# Si tu PVC raw-pvc ya existe con otro StorageClass, bórralo para recrearlo
kubectl delete pvc raw-pvc --ignore-not-found

echo "=== Paso 3: Instalando bootstrap ==="
pushd bootstrap >/dev/null
rm -f Chart.lock
helm dependency update
popd >/dev/null
helm upgrade --install bootstrap ./bootstrap

echo "=== Paso 4: Instalando databases ==="
pushd databases >/dev/null
rm -f Chart.lock
helm dependency update
popd >/dev/null
helm upgrade --install databases ./databases

echo "=== Paso 5: Instalando aplicación principal ==="
pushd application >/dev/null
rm -f Chart.lock
helm dependency update
popd >/dev/null
helm upgrade --install application ./application

echo "=== Verificando estado de los pods ==="
kubectl get pods -A
