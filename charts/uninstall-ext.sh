#!/bin/bash

echo "=== Eliminando TODOS los componentes de monitorización en TODOS los namespaces ==="

# 1. Desinstalar releases de Helm
echo "Desinstalando releases de Helm..."
helm list --all-namespaces | grep -E 'prometheus|monitoring|grafana' | awk '{print $1, $2}' | while read -r release namespace; do
  echo "Desinstalando $release de namespace $namespace"
  helm uninstall "$release" -n "$namespace" 2>/dev/null || true
done

# 2. Eliminar TODOS los ClusterRoles conflictivos
echo "Eliminando ClusterRoles conflictivos..."
kubectl get clusterrole | grep -E 'monitoring|prometheus|grafana' | awk '{print $1}' | xargs -I{} kubectl delete clusterrole {} --force --grace-period=0 2>/dev/null || true

# 3. Eliminar ClusterRoleBindings relacionados
echo "Eliminando ClusterRoleBindings..."
kubectl get clusterrolebinding | grep -E 'monitoring|prometheus|grafana' | awk '{print $1}' | xargs -I{} kubectl delete clusterrolebinding {} --force --grace-period=0 2>/dev/null || true

# 4. Buscar y eliminar servicios en TODOS los namespaces
echo "Eliminando servicios relacionados con monitorización en todos los namespaces..."
for ns in $(kubectl get namespaces -o jsonpath='{.items[*].metadata.name}'); do
  kubectl get svc -n "$ns" | grep -E 'monitoring|prometheus|grafana' | awk '{print $1}' | xargs -I{} kubectl delete svc {} -n "$ns" --force --grace-period=0 2>/dev/null || true
done

# 5. Eliminar específicamente el servicio coredns en kube-system
echo "Eliminando específicamente servicio monitoring-prometheus-coredns..."
kubectl delete svc monitoring-prometheus-coredns -n kube-system --force --grace-period=0 2>/dev/null || true

# 6. Eliminar ServiceMonitors en todos los namespaces
echo "Eliminando ServiceMonitors en todos los namespaces..."
for ns in $(kubectl get namespaces -o jsonpath='{.items[*].metadata.name}'); do
  kubectl delete servicemonitor --all -n "$ns" 2>/dev/null || true
done

# 7. Eliminar PodMonitors en todos los namespaces
echo "Eliminando PodMonitors en todos los namespaces..."
for ns in $(kubectl get namespaces -o jsonpath='{.items[*].metadata.name}'); do
  kubectl delete podmonitor --all -n "$ns" 2>/dev/null || true
done

echo "=== Limpieza completada ==="