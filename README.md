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
- **Database**: MongoDB Atlas with Mongoose
- **Auth**: NextAuth.js
- **Maps**: Leaflet (OpenStreetMap)
- **Real-time**: Polling-based updates (Socket.IO ready)

## Setup Instructions

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
   - Create `.env.local` file in the root directory
   - Add the following variables (NO SPACES after the equals sign):
   ```
   MONGODB_URI=mongodb+srv:
   NEXTAUTH_URL=
   NEXTAUTH_SECRET=
   GOOGLE_MAPS_API_KEY= 
   ```
   - Generate a NextAuth secret: `openssl rand -base64 32`
   - Get MongoDB Atlas connection string from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

3. **Set up Leaflet marker images:**
   - Download Leaflet default marker images from [GitHub](https://github.com/leaflet/leaflet/tree/master/dist/images)
   - Place `marker-icon.png`, `marker-icon-2x.png`, and `marker-shadow.png` in `public/leaflet/` directory
   - See `public/leaflet/README.md` for details

4. **Run the development server:**
```bash
npm run dev
```

5. **Open your browser:**
   - Navigate to [http://localhost:3000](http://localhost:3000)

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
│   └── mongodb.ts           # MongoDB connection
├── models/                  # MongoDB Mongoose models
│   ├── User.ts              # User model
│   ├── Plant.ts             # Plant model
│   ├── Trade.ts             # Trade model
│   ├── Message.ts           # Message model
│   └── ForumPost.ts         # Forum post model
├── types/                    # TypeScript type definitions
└── public/                   # Static assets
```

## Environment Variables

- `MONGODB_URI` - MongoDB Atlas connection string (required)
- `NEXTAUTH_URL` - Base URL for authentication (required, e.g., `http://localhost:3000`)
- `NEXTAUTH_SECRET` - Secret for NextAuth.js (required, generate with `openssl rand -base64 32`)
- `GOOGLE_MAPS_API_KEY` - Google Maps API key for enhanced geocoding (optional)

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
