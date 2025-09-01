# Product Selling Web

This project is a web application for managing product sales, stock, users, and more. It is built with React, TypeScript, Vite, and Tailwind CSS.

## API Endpoints Used

Below is a list of API endpoints called throughout the project, grouped by feature/module:

### Authentication

- `POST /auth/login` (src/services/authService.ts)
- `POST /user/login` (src/service/auth.tsx)
- `POST /user/register` (src/service/auth.tsx)
- `POST /user/get_user_info_by_token` (src/service/auth.tsx)

### Products

- `GET /products` (src/services/api.ts)
- `GET /products/:id` (src/services/api.ts)
- `POST /products` (src/services/api.ts)
- `PUT /products/:id` (src/services/api.ts)
- `DELETE /products/:id` (src/services/api.ts)
- `GET /products/search?...` (src/services/api.ts)

### Customers

- `POST /customer` (src/services/api.ts)
- `GET /customer` (src/services/api.ts)

### Orders

- `GET /order` (src/services/api.ts, src/service/order.tsx)
- `GET /order/allCustomer` (src/services/api.ts, src/service/order.tsx)

### Dashboard

- `GET /dashboard` (src/service/dashboard.tsx)

### Users

- `GET /user/get_all_user` (src/services/api.ts)

## Technologies Used

- React
- TypeScript
- Vite
- Tailwind CSS
- Axios

## Project Structure

- `src/components/` - Reusable UI components
- `src/pages/` - Main application pages
- `src/service/` and `src/services/` - API service modules

## Getting Started

1. Install dependencies:
   ```sh
   npm install
   ```
2. Start the development server:
   ```sh
   npm run dev
   ```

## Notes

- API base URL: `https://server.weadits.com/api`
- Ensure backend server is running and accessible.

---

For more details, see the source files in `src/services/` and `src/service/`.
