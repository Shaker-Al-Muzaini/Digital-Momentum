# FastAPI integration contract

All paths below are relative to FASTAPI_URL. Return JSON on reads, and JSON or 204 on successful mutations unless a response is specified. Dates are ISO strings. Monetary amounts are USD numbers. A localized label is a string or [Arabic, English]. Service IDs are integers. Require authentication for panel operations and the admin role for every /admin operation.

## Reads

| GET | Response fields |
|---|---|
| /me | {name, email, role: "admin" or "customer", balance}. Return 401 for a guest. |
| /services | Array of {id, platform, label, rate, min, max, color}. Public. Rate is per 1,000 units. |
| /dashboard | {total, active, spent, recent: Order[], week: number[7]} |
| /orders | Order[]. Each item contains id, name (localized service name), quantity, charge (historical charge), status. |
| /payments | {instructions: localized bank details, history: Payment[]} |
| /transactions | Array of {date, label, amount (signed), status} from the wallet ledger. |
| /tickets | Array of {id, subject, status} for this user. |
| /referrals | {visits, signups, earnings, url} |
| /account/api-key | {key} for the current user |
| /news | Array of {id, date, title} |
| /admin/dashboard | {revenue, active, pending, providers, payments: Review[]} |
| /admin/users | Array of {name, email, balance, status} |
| /admin/payments | Review[] |
| /admin/providers | Array of {name, latency (display string), balance (nullable), status} |
| /admin/proxies | Array of {address, latency (display string), status} |
| /admin/health | {cpu, ram, disk, telegram, services: [{name,status}]}. Metrics are percentages and telegram is boolean. |

Payment = {id, date, method: "local" or "card", amount, status}. Review adds name and reference. Order statuses understood by the filter are pending, prog, done, canc, partial, failed. Payment statuses are review, done, rej. Service health values include up and off. Return an empty array for an empty collection.

## Mutations

| POST | Request | Result |
|---|---|---|
| /auth/login | {email,password} | Establish session cookie |
| /auth/register | {name,email,password} | Establish session cookie |
| /auth/forgot | {email} | Initiate password recovery email |
| /auth/logout | Empty | Invalidate session and expire cookie |
| /account/password | {password} | Change authenticated user’s password |
| /contact | {name,email,message} | Accept public contact message |
| /orders | {service_id,link,quantity} | Record order and debit once |
| /orders/batch | {orders: [{service_id,link,quantity}]} | Validate entire batch, then debit and insert atomically |
| /payments/card | {amount} | {checkout_url} for HTTPS Stripe Checkout |
| /payments/local | multipart/form-data: amount, reference, receipt (image file) | Create payment in review |
| /admin/payments/{id}/review | {status: "done" or "rej"} | Approve or reject pending local payment once |
| /tickets | {subject,message} | Create support ticket |
| /admin/generate | {prompt} | {text} from the server-side Gemini integration |

The frontend supplies Idempotency-Key on orders, batches and payment creation. Store it server-side per user and operation, replay the same response for a retry, and reject reuse with a different payload. Validate quantities and links, derive price from the catalog and snapshot it on the order, lock wallet updates inside a transaction. Validate receipt type and size on the server. Credit card deposits after a verified checkout webhook. A checkout redirect or browser response alone should never credit a real wallet.

FastAPI and its workers own dispatch, supplier reconciliation and refunds. A partial result must credit only the unfulfilled portion once and appear in the ledger. Dashboard and financial views poll at 60-second intervals while mounted. Provider credentials, Gemini and Telegram tokens belong on the server. Server monitoring and proxy rotation run independently of the browser.
