# Payments & commissions

The database is prepared for:
- orders
- payment transactions
- platform commissions
- provider payouts

A payment processor account must be created by the business owner. Never place a secret API key in `frontend/`.

Recommended production flow:
1. Customer creates/accepts an order.
2. Frontend calls a trusted server/edge function.
3. Server creates a payment session with the chosen processor.
4. Processor webhook confirms payment.
5. Server updates `payment_transactions` and `orders`.
6. Server calculates `commissions`.
7. Provider payout is released according to your business rules.

Do not mark an order paid from a browser-only button.
