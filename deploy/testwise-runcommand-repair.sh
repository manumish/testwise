#!/bin/bash
set -euxo pipefail

systemctl restart firewalld || true
firewall-cmd --permanent --add-service=ssh || true
firewall-cmd --permanent --add-service=http || true
firewall-cmd --permanent --add-service=https || true
firewall-cmd --reload || true
systemctl restart sshd || true
systemctl restart nginx || true

hostname
ip -4 addr show || true
ip route || true
firewall-cmd --list-all || true
ss -ltnp || true
curl -I --max-time 5 http://127.0.0.1 || true
systemctl is-active sshd firewalld nginx || true
