#!/bin/bash

# 获取脚本所在目录
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 创建 systemd 服务文件
SERVICE_FILE="$HOME/.config/systemd/user/my-ledger.service"

mkdir -p "$HOME/.config/systemd/user"

cat > "$SERVICE_FILE" << EOF
[Unit]
Description=My Ledger Service
After=network.target

[Service]
Type=simple
WorkingDirectory=$DIR
ExecStart=/bin/bash $DIR/start.sh
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
EOF

# 启用服务
systemctl --user daemon-reload
systemctl --user enable my-ledger.service
systemctl --user start my-ledger.service

echo "服务已安装并启动"
echo "查看状态: systemctl --user status my-ledger.service"
echo "查看日志: journalctl --user -u my-ledger.service -f"
