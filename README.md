# HotelFinder - Multi-Supplier Hotel Search Engine

## Description
A resilient, enterprise-grade multi-supplier hotel rate comparison engine and booking platform. Aggregates live hotel rates across multiple wholesale suppliers in parallel with guaranteed lowest-price discovery, Temporal workflow orchestration, resilient offline fallback, OpenAPI 3.0 documentation, and persistent reservations management.

## How to Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Servers
Runs backend API (port 3001), Temporal background worker, and React frontend (port 3000) concurrently:
```bash
npm run dev
```

- **Frontend Application**: http://localhost:3000
- **Backend API & Swagger Docs**: http://localhost:3001/api-docs

## How to Test

Run test suites across both frontend and backend:
```bash
npm test
```

To run individual test suites:
- **Backend Tests (Vitest)**: `cd backend && npm test`
- **Frontend Tests (Vitest)**: `cd frontend && npm test`
- **TypeScript Type Check**: `npm run lint`

## Author
**Aakarsh Sharma**
- GitHub: [@aakarsh-sharma118](https://github.com/aakarsh-sharma118)
