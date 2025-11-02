# Database Migration Reminder

## ⚠️ Important: Run Database Migrations

The `TradeReview` model has been added to the schema, but you need to run migrations to create the table in your database.

### Steps to Fix:

1. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

2. **Push schema changes to database:**
   ```bash
   npx prisma db push
   ```

   OR create a migration:
   ```bash
   npx prisma migrate dev --name add_trade_reviews
   ```

3. **Restart your development server:**
   ```bash
   npm run dev
   ```

### What This Does:

- Creates the `trade_reviews` table
- Adds relationships between User, Trade, and TradeReview models
- Enables the reviews and ratings feature

### Current Status:

The code has been updated to handle missing `TradeReview` table gracefully (won't crash), but reviews won't work until migrations are run.

---

**After running migrations, the "User not found" error should be resolved!**

