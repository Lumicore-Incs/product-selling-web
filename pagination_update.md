# Frontend Pagination Implementation Prompt

I have a React frontend that currently calls `GET /order/allCustomer` with only an `Authorization` header and receives a flat array of orders. The backend has been updated to support server-side pagination, filtering by status, and search. I need you to update the existing "All Orders" / "All Customers" page/component to use the new paginated API.

---

## Updated API: `GET /order/allCustomer`

**Request headers:**
- `Authorization: <jwt_token>`

**Query parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | `0` | 0-based page index |
| `size` | number | `20` | Items per page |
| `status` | string | `""` | Order status filter — send `"all"` or empty string for no filter |
| `search` | string | `""` | Searches across: customer name, contact01, contact02, weyBillId, serialNo |

**Response shape (Spring Page object):**
```json
{
  "content": [ ],
  "totalElements": 150,
  "totalPages": 8,
  "number": 0,
  "size": 20,
  "first": true,
  "last": false
}
```

---

## Status Filter Options (dropdown)

```js
[
  { value: 'all', label: 'ALL STATUS' },
  { value: 'PENDING', label: 'PENDING' },
  { value: 'TEMPORARY', label: 'DUPLICATE' },
  { value: 'Processing', label: 'PROCESSING' },
  { value: 'Dispatched to Destination', label: 'DISPATCHED TO DESTINATION' },
  { value: 'Received at Destination', label: 'RECEIVED AT DESTINATION' },
  { value: 'Received by Client', label: 'RECEIVED BY CLIENT' },
  { value: 'Out for Delivery', label: 'OUT FOR DELIVERY' },
  { value: 'Rescheduled', label: 'RESCHEDULED' },
  { value: 'Failed to Deliver', label: 'FAILED TO DELIVER' },
  { value: 'Returned to Client', label: 'RETURNED TO CLIENT' },
  { value: 'Delivered', label: 'DELIVERED' },
]
```

---

## Requirements

1. **Replace** the existing flat-array API call with the new paginated call using `page`, `size`, `status`, and `search` params.
2. Add a **search input** (debounced ~400ms) that sets the `search` param and resets `page` to `0` on change.
3. Add a **status dropdown** using the options above that sets the `status` param and resets `page` to `0` on change.
4. Add a **pagination control** at the bottom of the table showing:
   - Previous / Next buttons (disabled at boundaries)
   - Current page and total pages display (e.g., "Page 2 of 8")
   - Total records count (e.g., "150 records found")
5. Page size can be fixed at `20` or optionally a per-page selector (10 / 20 / 50).
6. When `status` is `"all"` or unselected, send `""` or `"all"` — either is accepted by the backend.
7. Reset to page `0` whenever search or status filter changes.
8. Show a loading state while fetching.
9. Keep all existing table columns and row rendering intact — only change the data source and add the controls above the table.
