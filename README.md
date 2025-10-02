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

- getTodaysOrders(): Promise<OrderDtoGet[]>

  - GET /order — fetch today's orders

- getAllOrders(): Promise<OrderDtoGet[]>

  - GET /order/allCustomer — fetch all orders; includes a 404 fallback to `/order` if the endpoint is missing

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

---

## Notes & Next Steps

- The `api.ts` file currently mixes low-level axios config usage and many concrete endpoint functions. To improve maintainability:

  1.  Export the configured axios instance from `src/services/axiosConfig` (already present) and keep only that in `api.ts` (or rename `api.ts` to `apiClient.ts`).
  2.  Move the grouped endpoint functions into per-resource service modules (e.g., `src/services/products.ts`, `src/services/customers.ts`, `src/services/orders.ts`, `src/services/users.ts`, `src/services/dashboard.ts`).
  3.  Add TypeScript types and small runtime guards for DTO shapes where useful, or add unit tests for mapping helpers.

- I can proceed to: (choose one)
  - Move all endpoint functions out of `src/services/api.ts` into resource files and replace `api.ts` with a single axios export.
  - Or: generate the new service files with the existing functions (automated refactor), run type-checks, and open a PR/branch.

If you want me to proceed with the refactor, tell me whether you prefer the endpoints moved to `src/services/products.ts` / `orders.ts` / `customers.ts` etc., and if you want me to also create tests.

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
