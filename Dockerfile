FROM node:20.12.1 as builder
ENV TZ="Asia/Seoul"

WORKDIR /app

COPY . .

RUN npm install

RUN npm run build

# ---

FROM node:20.12.1-slim
ENV TZ="Asia/Seoul"

WORKDIR /app

RUN apt-get update && apt-get install -y gnupg curl

# MongoDB의 공식 GPG 키 추가
RUN curl -fsSL https://pgp.mongodb.com/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg

# MongoDB 저장소 목록에 추가
RUN echo "deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# 로컬 패키지 데이터베이스 다시 로드
RUN apt-get update

# MongoDB 도구 설치
RUN apt-get install -y mongodb-org-tools

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

ENTRYPOINT ["node", "dist/index.js"]