# 🌿 SproutShare - Plant Swapping Community Platform

A full-stack application connecting local plant lovers to trade plants, share care tips, and grow community connections.

## Features

- 🌱 **User Profiles** with plant subprofiles and follow/friend functionality
- 🔄 **Trading System** with geolocation-based matching and map integration
- 📚 **Plant Library** with search, like functionality, and recommendation algorithm
- 💬 **Messaging System** (private messages + forums) with real-time updates

## Tech Stack

- **Frontend**: Next.js 15, React, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma (Supabase/Neon - Production Optimized!)
- **Auth**: NextAuth.js
- **Maps**: Leaflet (OpenStreetMap)
- **Real-time**: Polling-based updates (Socket.IO ready)

### Production Optimizations

- ✅ Connection pooling via Supabase pgbouncer
- ✅ Optimized queries with selective field selection
- ✅ Composite indexes for common query patterns
- ✅ Geospatial query optimization with bounding boxes
- ✅ Query performance monitoring
- ✅ Error handling with retry logic
- ✅ Query result caching
- ✅ Parallel query execution

See [PRODUCTION_OPTIMIZATIONS.md](./PRODUCTION_OPTIMIZATIONS.md) for details.

## Setup Instructions

1. **Install dependencies:**
```bash
npm install
```

2. **Set up database (PostgreSQL):**
   - **Recommended**: Create a free account at [Supabase](https://supabase.com) or use [Neon](https://neon.tech)
   - Create a new project and copy your connection string
   - Or use any PostgreSQL provider (Railway, Render, etc.)

3. **Set up environment variables:**
   - Create `.env.local` file in the root directory (or update existing one)
   - Add your PostgreSQL connection string:
   ```
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/[DATABASE]?schema=public
   ```
   - For Supabase, the format is:
   ```
   DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

4. **Initialize database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```
   This creates all tables in your PostgreSQL database.

5. **Set up Leaflet marker images:**
   - Download Leaflet default marker images from [GitHub](https://github.com/leaflet/leaflet/tree/master/dist/images)
   - Place `marker-icon.png`, `marker-icon-2x.png`, and `marker-shadow.png` in `public/leaflet/` directory
   - See `public/leaflet/README.md` for details

6. **Run the development server:**
```bash
npm run dev
```

7. **Open your browser:**
   - Navigate to [http://sproutshare.tech](http://sproutshare.tech)

## Project Structure

```
├── app/                    # Next.js app router pages
│   ├── api/                 # API routes
│   ├── forum/               # Forum pages
│   ├── library/             # Plant library
│   ├── messages/            # Messaging pages
│   ├── profile/             # User profiles
│   ├── trades/              # Trading pages
│   └── ...                  # Other pages
├── components/              # React components
│   ├── MapView.tsx          # Leaflet map component
│   └── Navbar.tsx           # Navigation bar
├── lib/                     # Utilities and configurations
│   ├── auth.ts              # Authentication helpers
│   ├── geocoding.ts         # Zip to coordinates conversion
│   └── db.ts                # PostgreSQL Prisma connection
├── prisma/                  # Database schema and migrations
│   └── schema.prisma        # Prisma schema definition
├── models/                  # Legacy Mongoose models (being migrated)
│   ├── User.ts              # User model
│   ├── Plant.ts             # Plant model
│   ├── Trade.ts             # Trade model
│   ├── Message.ts           # Message model
│   └── ForumPost.ts         # Forum post model
├── types/                    # TypeScript type definitions
└── public/                   # Static assets
```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (required) - Get from Supabase, Neon, or your PostgreSQL provider
- `NEXTAUTH_URL` - Base URL for authentication (default: `http://localhost:3000`)
- `NEXTAUTH_SECRET` - Secret for NextAuth.js (required, generate with `openssl rand -base64 32`)
- `GOOGLE_MAPS_API_KEY` - Google Maps API key for enhanced geocoding (optional)

## Database

This project uses **PostgreSQL** - a powerful, production-ready relational database:
- ✅ **High performance** - Optimized for complex queries and large datasets
- ✅ **ACID compliance** - Full transaction support
- ✅ **Scalable** - Handles concurrent users efficiently
- ✅ **Production-ready** - Industry standard for web applications
- ✅ **Rich features** - Full-text search, JSON support, and more

## Key Features Explained

### User Profiles
- Each user has a profile with bio, join date, followers/following counts
- Users can add multiple plant subprofiles
- Follow/friend functionality to build connections

### Trading System
- Create trade offers with what you're offering and what you're looking for
- Location-based matching using zip codes
- Map view to visualize nearby trades
- Distance calculation and sorting by proximity

### Plant Library
- Browse all plants in the community
- Search by name, scientific name, or description
- Like plants to build your favorites
- View plant details including care tips and maintenance levels

### Messaging & Forums
- Private one-on-one messaging
- Public forum with categories (general, trading tips, care advice, community)
- Real-time updates using polling (Socket.IO ready for production)

## Next Steps for Production

1. **Set up Socket.IO server** for real-time messaging
2. **Implement proper geocoding** with Google Maps API
3. **Add image upload** functionality for plant photos
4. **Implement recommendation algorithm** based on likes and trade patterns
5. **Add email notifications** for trades and messages
6. **Set up proper error handling** and logging
7. **Add rate limiting** to API routes
8. **Implement caching** for better performance

## Contributing

This is a starter implementation. Feel free to extend and customize for your needs!

## License

MIT
