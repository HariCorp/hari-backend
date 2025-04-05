# Hướng dẫn chạy dự án Hari Backend

Dự án này có thể được chạy theo hai cách:
1. Chạy tất cả các dịch vụ trong Docker
2. Chỉ chạy các dịch vụ cơ sở hạ tầng (infrastructure) trong Docker và chạy các microservices trong terminal

## 1. Chạy toàn bộ dự án trong Docker

```bash
# Di chuyển đến thư mục docker development
cd docker/development

# Khởi động tất cả các dịch vụ
docker-compose up -d
```

## 2. Chạy infrastructure trong Docker và microservices trong terminal

### Bước 1: Khởi động các dịch vụ cơ sở hạ tầng (MongoDB, Redis, Kafka,...)

```bash
# Di chuyển đến thư mục docker development
cd docker/development

# Khởi động các dịch vụ cơ sở hạ tầng
docker-compose -f infrastructure-docker-compose.yml up -d
```

### Bước 2: Chạy các microservices trong terminal

Có hai cách để chạy các dịch vụ:

#### Cách 1: Sử dụng npm trực tiếp

Từ thư mục gốc của dự án, bạn có thể chạy:

```bash
# Chạy một dịch vụ cụ thể
npm run start:dev api-gateway
npm run start:dev auth-service
npm run start:dev user-service
npm run start:dev product-service
npm run start:dev payment-service
npm run start:dev ai-service
```

#### Cách 2: Sử dụng script trợ giúp

```bash
# Đảm bảo bạn đang ở thư mục gốc của dự án
cd /path/to/hari-backend

# Cấp quyền thực thi cho script (nếu chưa làm)
chmod +x scripts/start-services.sh

# Chạy một dịch vụ cụ thể
./scripts/start-services.sh api-gateway
./scripts/start-services.sh auth-service
./scripts/start-services.sh user-service
./scripts/start-services.sh product-service
./scripts/start-services.sh payment-service
./scripts/start-services.sh ai-service
```

Lưu ý: Khi chạy microservices ở local, bạn cần mở nhiều terminal để chạy đồng thời các dịch vụ khác nhau.

### Sử dụng tmux (tùy chọn)

Nếu bạn muốn chạy nhiều dịch vụ cùng lúc mà không cần mở nhiều terminal, bạn có thể sử dụng tmux:

```bash
# Cài đặt tmux (nếu chưa cài)
brew install tmux  # macOS
apt-get install tmux  # Ubuntu

# Tạo các session tmux cho từng dịch vụ
tmux new-session -d -s api-gateway 'cd /path/to/hari-backend && npm run start:dev api-gateway'
tmux new-session -d -s auth-service 'cd /path/to/hari-backend && npm run start:dev auth-service'
tmux new-session -d -s user-service 'cd /path/to/hari-backend && npm run start:dev user-service'
tmux new-session -d -s product-service 'cd /path/to/hari-backend && npm run start:dev product-service'
tmux new-session -d -s payment-service 'cd /path/to/hari-backend && npm run start:dev payment-service'
tmux new-session -d -s ai-service 'cd /path/to/hari-backend && npm run start:dev ai-service'

# Để xem một session cụ thể
tmux attach-session -t api-gateway

# Để thoát khỏi một session (không dừng nó), nhấn Ctrl+B sau đó nhấn D
```

## Dừng các dịch vụ

### Dừng các dịch vụ cơ sở hạ tầng trong Docker

```bash
cd docker/development
docker-compose -f infrastructure-docker-compose.yml down
```

### Dừng các microservices chạy trong terminal

Nếu bạn đang chạy các dịch vụ trực tiếp trong terminal, nhấn Ctrl+C để dừng chúng.

Nếu bạn đang sử dụng tmux:

```bash
# Dừng tất cả các session tmux
tmux kill-server

# Hoặc dừng từng session cụ thể
tmux kill-session -t api-gateway
tmux kill-session -t auth-service
# và các session khác
``` 