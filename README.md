## Speezup Backend – Marketplace Service

A high-performance, secure backend for a multi-role marketplace platform, supporting **customers**, **store owners**, and **delivery partners**.  
Built with **Fastify**, **Prisma/PostgreSQL**, **BullMQ**, **Redis**, and **JWT** authentication.

---

### Overview

- **Multi-role architecture**: customer, store, and delivery flows.
- **OTP-based mobile login** with HMAC hashing and strict rate limiting.
- **JWT access + refresh tokens** with session management (single active session per user).
- **Async processing** via BullMQ for tasks such as sending OTPs and background jobs.
- **Transactional safety** via Prisma + idempotency keys.
- **Hybrid API**: REST endpoints + GraphQL for observability and queue testing.
- **Metrics & monitoring** powered by Redis.

---

### Tech Stack

| Layer              | Technology                    |
| ------------------ | ---------------------------- |
| Backend Framework  | Fastify                      |
| ORM                | Prisma                       |
| Database           | PostgreSQL                   |
| Caching & Queues   | Redis, BullMQ                |
| Authentication     | JWT, OTP (HMAC-based)        |
| Job Queue          | BullMQ / BullMQ Worker       |
| Async Processing   | BullMQ Workers               |
| Deployment         | Docker (container-friendly)  |

---

### Getting Started

#### Prerequisites

- **Node.js** (LTS recommended)
- **npm** or **pnpm/yarn**
- **PostgreSQL** running locally or in the cloud
- **Redis** instance

#### 1. Clone the repository

```bash
git clone <repo-url>
cd speezup-backend
```

#### 2. Install dependencies

```bash
npm install
```

#### 3. Configure environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/speezup
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=your_jwt_secret
OTP_SECRET=your_otp_secret
PORT=4000
```

Adjust the values to match your local or production environment.

#### 4. Run database migrations & generate Prisma client

```bash
npx prisma generate
npx prisma migrate dev --name init
```

#### 5. Start the backend

```bash
npm run dev
```

The server will start on `http://localhost:4000` (or the `PORT` you configured).

#### 6. Access GraphQL Playground

Open in your browser:

```text
http://localhost:4000/graphiql
```

---

### API Overview

Below are some of the main REST endpoints and example payloads.

#### 1. OTP Authentication

##### Send OTP

- **Endpoint**: `POST /otp/send`

**Body:**

```json
{
  "phone": "9876543210"
}
```

**Response:**

```json
{
  "success": true,
  "message": "OTP sent successfully",
  "ttl": 120
}
```

##### Verify OTP

- **Endpoint**: `POST /otp/verify`

**Body:**

```json
{
  "phone": "9876543210",
  "otp": "123456",
  "role": "CUSTOMER"
}
```

**Response:**

```json
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
```

---

#### 2. User Routes

##### Get Current User

- **Endpoint**: `GET /user/me`  
- **Headers**: `Authorization: Bearer <accessToken>`

**Response:**

```json
{
  "success": true,
  "user": {
    "id": 1,
    "phone": "9876543210",
    "name": null,
    "role": "CUSTOMER"
  }
}
```

---

#### 3. Store Routes (Example)

##### Create Store

- **Endpoint**: `POST /store`  
- **Headers**: `Authorization: Bearer <accessToken>`

**Body:**

```json
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
```

**Response:**

```json
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
```

---

### GraphQL Examples

GraphQL endpoint (default):

```text
http://localhost:4000/graphql
```

> If your server exposes `graphiql` directly, you can also use `http://localhost:4000/graphiql`.

#### Query: `redisPing`

```graphql
query {
  redisPing
}
```

**Response:**

```json
{
  "data": {
    "redisPing": "PONG"
  }
}
```

#### Mutation: Add a test job to the queue

```graphql
mutation {
  addJob(message: "Hello World")
}
```

**Response:**

```json
{
  "data": {
    "addJob": true
  }
}
```

---

### Notes & Behavior

- **OTP rate limiting**: OTP requests are rate-limited per `phone + IP` to prevent abuse.
- **Refresh token rotation**: refresh tokens are rotated on verification; only **one active session per user** is allowed.
- **BullMQ workers**: OTP and other jobs are processed asynchronously and logged for success/failure.
- **Prisma models**: support soft deletes, reserved stock, and order status history.
- **Response format**: all APIs use a consistent `success` / `fail` wrapper for responses.

---

### Postman Collection (Suggested)

You can create a Postman collection with at least these requests:

- **POST** `/otp/send` – Send OTP
- **POST** `/otp/verify` – Verify OTP, returns `accessToken` and `refreshToken`
- **GET** `/user/me` – Fetch current user (requires `Authorization: Bearer <accessToken>`)
- **POST** `/store` – Create store (requires `Authorization: Bearer <accessToken>`)
- **GraphQL** – `http://localhost:4000/graphql` or `http://localhost:4000/graphiql` with `hello`, `redisPing`, `addJob`, etc.

---

### Production Considerations

- **Secrets**: store `JWT_SECRET`, `OTP_SECRET`, and database credentials in a secure secret manager (not committed to Git).
- **TLS/HTTPS**: run behind a reverse proxy (Nginx, Traefik, API gateway) with HTTPS termination.
- **Scaling**: run multiple Fastify instances behind a load balancer; use a shared Redis + PostgreSQL.
- **Monitoring**: hook Redis/BullMQ metrics and logs into your monitoring stack (Prometheus/Grafana, ELK, etc.).
