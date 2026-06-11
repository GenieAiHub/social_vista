---
name: Postgres serial sequence sync
description: Why inserts collide after copying rows with explicit IDs, and how to fix.
---

When you copy/seed rows into a Postgres table using **explicit** `id` values (e.g. migrating dev → Neon prod), the column's `serial`/identity sequence is NOT advanced. It stays at its old value (often 1).

**Symptom:** the next plain `INSERT` (no id given) fails with `duplicate key value violates unique constraint "<table>_pkey"`, `Key (id)=(1) already exists`. This also breaks any app/admin feature that creates rows.

**Fix:** after any explicit-id copy, resync the sequence:
```sql
SELECT setval(pg_get_serial_sequence('services','id'), COALESCE((SELECT MAX(id) FROM services), 1));
```

**How to apply:** run this on every DB you copied into (dev AND prod/Neon). Do it as part of the copy script so it's not forgotten.
