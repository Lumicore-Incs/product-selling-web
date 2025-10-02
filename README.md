# product-selling-web — Project README

This repository is a Vite + React + TypeScript application for a simple product selling web app.

## Getting Started

1. Run `npm install`
2. Run `npm run dev`

---

## API list

#### productApi

- getAllProducts(): Promise<ProductDto[]>

  - GET /products — fetch all products

- getProductById(id: number): Promise<ProductDto>

  - GET /products/{id} — fetch a single product

- createProduct(product: Omit<ProductDto, 'productId'>): Promise<ProductDto>

  - POST /products — create a product

- updateProduct(id: number, product: Omit<ProductDto, 'productId'>): Promise<ProductDto>

  - PUT /products/{id} — update a product

- deleteProduct(id: number): Promise<boolean>

  - DELETE /products/{id} — delete a product (returns boolean success)

- searchProducts(name?: string, minPrice?: number, maxPrice?: number): Promise<ProductDto[]>
  - GET /products/search?name=...&minPrice=...&maxPrice=... — search products with query params

#### customerApi

- createCustomer(customerData: CustomerRequestDTO): Promise<CustomerDtoGet>

  - POST /customer — create a new customer (and order). Note: the implementation throws an error when the response status is `207` (DUPLICATE_CUSTOMER).

- getAllCustomers(): Promise<CustomerDtoGet[]>
  - GET /customer — fetch all customers

#### orderApi

-

- getAllDuplicateOrders(): Promise<OrderDtoGet[]>

  - GET /order/duplicate — fetch duplicate orders; includes 404 fallback handling

- testConnection(): Promise<boolean>
  - GET /order — quick connectivity test returning boolean

#### userApi

- getAllUsers(): Promise<User[]> (maps backend `UserApiDto[]` into frontend `User[]`)

  - GET /user/get_all_user

- updateUser(id: string, userData: Partial<User>): Promise<User>

  - PUT /user/update/{id} — update user; maps backend DTO into frontend `User`

- deleteUser(id: string): Promise<boolean>
  - DELETE /user/{id} — delete user (returns boolean success)

#### dashboardApi

- exportSalesExcel(endpoint: string): Promise<Blob>
  - GET {endpoint} with responseType 'blob' — used to download Excel/Blob payloads (example: `/dashboard/conform` in existing usage)

#### authService (src/services/authService.ts)

- login(credentials: LoginRequest): Promise<LoginResponse>

  - POST /auth/login — authenticate user and persist token via `authUtils.setToken`

- logout(): void
  - Clears stored token (client-side) and redirects to `/auth` via `authUtils.logout`

#### orderService (src/services/orders/orderService.ts)

- getAllDuplicateOrders(): Promise<Sale[]>

  - GET /order/duplicate — fetch duplicate orders and map backend DTO → frontend `Sale` model

- ✅ deleteOrder(id: string): Promise<unknown>

  - DELETE /order/{id} — delete order by id

- ✅ getTodaysOrders(): Promise<OrderDtoGet[]>

  - GET /order — fetch today's orders

- updateOrder(id: string, payload: unknown): Promise<unknown>

  - PUT /order/{id}/resolve — update/resolve an order

- getOrders(): Promise<Sale[]>

  - Fallbacks to other order endpoints when available; returns mapped `Sale[]`

- ✅ getAllCustomerOrders(): Promise<Sale[]>

  - GET /order/allCustomer — fetch all orders; includes a 404 fallback to `/order` if the endpoint is missing

    Note: `orderService` is the recommended place for order-related API logic (used by pages such as `DuplicateSales` and `SalesManagement`).

#### Local product helper (src/service/product.tsx)

- getAllProducts(): Promise<ProductDto[]>
  - GET /products — convenience wrapper that uses the shared axios client (`axiosConfig`) and returns response data.

### DTO / Type definitions (declared in `api.ts`)

- ProductDto

  - productId?: number
  - name: string
  - price: number
  - status?: 'active' | 'inactive' | 'remove'

- OrderItem

  - productId: number
  - productName: string
  - qty: number
  - price: number
  - total: number
  - orderDetailsId: number
  - orderId: number

- CustomerRequestDTO

  - name, address, contact01, contact02?, qty, remark, totalPrice, items: OrderItem[]

- CustomerDtoGet

  - customerId, name, address, contact01, contact02?, qty, userId, createdDate, status

- OrderDtoGet

  - orderId, customerId, name, address, contact01, contact02?, qty, remark, items: OrderItem[], totalPrice, orderDate, status, userId

- OrderDetailsDto

  - orderDetailsId?, qty, total, productId, orderId?

- UserApiDto

  - id, name, email, telephone, role, registration_date, status, type?

- User (frontend mapped)
  - id: string, name, email, contact, role, registration_date, status: 'active' | 'inactive' | 'pending'

---
