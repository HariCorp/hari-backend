#!/bin/bash

# File này giúp chạy các dịch vụ từ terminal địa phương

# Kiểm tra xem người dùng muốn chạy dịch vụ nào
SERVICE=$1
ROOT_DIR=$(pwd)

# Kiểm tra xem đã cung cấp tên dịch vụ chưa
if [ -z "$SERVICE" ]; then
  echo "Sử dụng: $0 <service-name>"
  echo "Các dịch vụ có sẵn: api-gateway, auth-service, user-service, product-service, payment-service, ai-service, all"
  exit 1
fi

# Chạy dịch vụ dựa trên tham số đầu vào
case $SERVICE in
  "api-gateway"|"auth-service"|"user-service"|"product-service"|"payment-service"|"ai-service")
    echo "Đang chạy $SERVICE..."
    npm run start:dev $SERVICE
    ;;
  "all")
    # Sử dụng terminal multiplexer như tmux hoặc mở nhiều terminal
    echo "Để chạy tất cả các dịch vụ, bạn nên mở nhiều terminal hoặc sử dụng tmux"
    echo "Ví dụ sử dụng tmux:"
    echo "tmux new-session -d -s api-gateway 'cd $ROOT_DIR && npm run start:dev api-gateway'"
    echo "tmux new-session -d -s auth-service 'cd $ROOT_DIR && npm run start:dev auth-service'"
    echo "tmux new-session -d -s user-service 'cd $ROOT_DIR && npm run start:dev user-service'"
    echo "tmux new-session -d -s product-service 'cd $ROOT_DIR && npm run start:dev product-service'"
    echo "tmux new-session -d -s payment-service 'cd $ROOT_DIR && npm run start:dev payment-service'"
    echo "tmux new-session -d -s ai-service 'cd $ROOT_DIR && npm run start:dev ai-service'"
    ;;
  *)
    echo "Dịch vụ không hợp lệ: $SERVICE"
    echo "Các dịch vụ có sẵn: api-gateway, auth-service, user-service, product-service, payment-service, ai-service, all"
    exit 1
    ;;
esac 