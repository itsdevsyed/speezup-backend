Speezy – Backend Marketplace Service

A high-performance, secure backend for a multi-role marketplace platform, supporting customers, store owners, and delivery partners.
Built with Fastify, Prisma/PostgreSQL, BullMQ, Redis, and JWT authentication.

Features

OTP-based mobile authentication with HMAC hashing and rate limiting

JWT-based access & refresh tokens with session management

Async job processing via BullMQ for tasks like sending OTPs

Transactional safety using Prisma and idempotency keys

Modular plugin-based Fastify architecture for scalable and maintainable services

Redis metrics for observability and basic monitoring

GraphQL + REST hybrid API

Tech Stack
Layer	Technology
Backend Framework	Fastify
ORM	Prisma
Database	PostgreSQL
Caching & Queues	Redis, BullMQ
Authentication	JWT, OTP
Job Queue	BullMQ
Async Processing	BullMQ Worker
Deployment	Docker
Setup Instructions

Clone repository

git clone <repo-url>
cd backend


Install dependencies

npm install


Environment variables
Create .env file:

DATABASE_URL=postgresql://user:password@localhost:5432/speezy
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=your_jwt_secret
OTP_SECRET=your_otp_secret
PORT=4000


Generate Prisma client

npx prisma generate
npx prisma migrate dev --name init


Start backend

npm run dev


Access GraphQL UI

http://localhost:4000/graphiql

API Documentation
1. OTP Authentication
Send OTP

Endpoint: POST /otp/send

Body:

{
  "phone": "9876543210"
}


Response:

{
  "success": true,
  "message": "OTP sent successfully",
  "ttl": 120
}

Verify OTP

Endpoint: POST /otp/verify

Body:

{
  "phone": "9876543210",
  "otp": "123456",
  "role": "CUSTOMER"
}


Response:

{
  "success": true,
  "accessToken": "<jwt_access_token>",
  "refreshToken": "<jwt_refresh_token>",
  "expires_in": 900,
  "user": {
    "id": 1,
    "phone": "9876543210",
    "name": null,
    "role": "CUSTOMER"
  }
}

2. User Routes
Get Current User

Endpoint: GET /user/me

Headers: Authorization: Bearer <accessToken>

Response:

{
  "success": true,
  "user": {
    "id": 1,
    "phone": "9876543210",
    "name": null,
    "role": "CUSTOMER"
  }
}

3. Store Routes (Example)
Create Store

Endpoint: POST /store

Headers: Authorization: Bearer <accessToken>

Body:

{
  "name": "My Store",
  "description": "Best store in town",
  "phone": "9876543210",
  "address": {
    "street": "123 Main St",
    "city": "CityName",
    "state": "StateName",
    "postalCode": "123456",
    "country": "CountryName",
    "latitude": 12.3456,
    "longitude": 78.9012
  }
}


Response:

{
  "success": true,
  "store": {
    "id": 1,
    "name": "My Store",
    "description": "Best store in town",
    "phone": "9876543210",
    "ownerId": 1,
    "addressId": 1
  }
}

4. GraphQL Example

Query: redisPing

query {
  redisPing
}


Response:

{
  "data": {
    "redisPing": "PONG"
  }
}


Mutation: Add a test job to queue

mutation {
  addJob(message: "Hello World")
}


Response:

{
  "data": {
    "addJob": true
  }
}

Notes

OTP requests are rate-limited per phone + IP.

Refresh tokens are rotated on verification; only one active session per user is allowed.

BullMQ processes OTP jobs asynchronously; logs success/failure.

Prisma models support soft deletes, reserved stock, and order status history.

All API responses use a consistent success/fail wrapper.

Postman Collection

You can create a Postman collection with these routes:

POST /otp/send – Send OTP

POST /otp/verify – Verify OTP, returns accessToken

GET /user/me – Fetch current user with Bearer token

POST /store – Create store (requires Bearer token)

GraphQL endpoint http://localhost:4000 – run hello, redisPing, addJob