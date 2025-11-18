# Community Bus Tracking System - Phase 1

A modern, full-featured bus tracking and management system built with React, TypeScript, Supabase, and React Leaflet.

## Features Implemented (Phase 1)

### Authentication System
- Email/password authentication with role-based access
- Four user roles: User, Admin, Driver, Conductor
- Secure login and signup flows
- Protected routes based on user roles

### Admin Panel
- **Dashboard**: Overview with statistics (total buses, routes, users, tickets)
- **Route Management**: Create and manage bus routes with multiple stops
- **Bus Management**: Add buses, assign to routes, manage status
- **Ticket Viewing**: Monitor all ticket bookings
- **Interactive Map**: View all routes and stops on Pune city map
- **Placeholders**: For future accident alerts and maintenance predictions

### User Panel
- **Dashboard**: Interactive map showing routes, stops, and live location
- **Route Search**: Find and explore available bus routes
- **Nearby Stops**: Discover bus stops near current location with distance calculation
- **Ticket Booking**: Book tickets by selecting route, boarding stop, and destination
- **My Tickets**: View all booked tickets with details
- **Interactive Maps**: Full navigation and visualization

### Driver Panel (UI Only)
- Route overview and map visualization
- Emergency alert button (placeholder)
- Trip completion button (placeholder)

### Conductor Panel (UI Only)
- Daily report submission form
- Passenger count tracking
- Cash collection recording

### Technical Features
- React Leaflet integration with OpenStreetMap
- Fully responsive design with Tailwind CSS
- TypeScript for type safety
- Supabase backend with Row Level Security
- Simulated bus markers for demonstration
- Clean, modern UI with soft color scheme

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account

### 1. Clone and Install

```bash
npm install --include=dev
```

### 2. Configure Supabase

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

The database schema is already created via migrations. The following tables are set up:

- `profiles` - User profiles with role information
- `routes` - Bus routes
- `stops` - Bus stops with GPS coordinates
- `route_stops` - Junction table linking routes to stops
- `buses` - Bus fleet information
- `tickets` - User ticket bookings
- `conductor_reports` - Daily conductor reports

All tables have Row Level Security (RLS) enabled with appropriate policies.

### 4. Run the Application

```bash
npm run dev
```

The application will start on `http://localhost:5173`

### 5. Create Your First Admin User

1. Go to `/signup`
2. Select "Admin" as role
3. Complete registration
4. Login with your credentials

## User Roles and Access

### Admin
- Full access to route, bus, and stop management
- View all tickets and reports
- Dashboard with system statistics

### User
- Search and view routes
- Find nearby stops
- Book tickets
- View personal ticket history

### Driver
- View assigned route
- Access route map
- Emergency alert functionality (Phase 2)

### Conductor
- Submit daily reports
- Track passenger count and cash collection

## Project Structure

```
src/
├── components/        # Reusable components (Map, Layout, etc.)
├── contexts/          # React contexts (AuthContext)
├── lib/              # Supabase client and type definitions
├── pages/            # Page components organized by role
│   ├── admin/        # Admin panel pages
│   ├── auth/         # Login and signup pages
│   ├── conductor/    # Conductor panel
│   ├── driver/       # Driver panel
│   └── user/         # User panel pages
└── utils/            # Utility functions and helpers
```

## Technologies Used

- **Frontend**: React 18 + TypeScript
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS
- **Maps**: React Leaflet + Leaflet
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Build Tool**: Vite

## Design Philosophy

The application follows these design principles:
- Minimal and uncluttered interface
- Soft, calm, aesthetic feel
- High readability with proper typography
- Clean spacing and balanced contrasts
- Simple layouts for intuitive navigation
- Consistent components across panels
- Desktop-first with responsive considerations

## Sample Data

To get started quickly, you can add sample data:

### Sample Stops (Pune)
1. Shivajinagar - Lat: 18.5314, Lng: 73.8446
2. Swargate - Lat: 18.5018, Lng: 73.8636
3. Kothrud - Lat: 18.5074, Lng: 73.8077
4. Deccan - Lat: 18.5167, Lng: 73.8424

### Sample Route
Create a route connecting these stops in order.

## Phase 2 Features (Coming Soon)

- Real-time GPS tracking with ESP32 hardware
- Accident detection with sensors
- Machine learning for maintenance predictions
- QR code ticket verification
- Seat availability tracking
- Payment gateway integration
- Mobile app for conductors
- Advanced analytics dashboard

## Build for Production

```bash
npm run build
```

The production build will be created in the `dist/` directory.

## License

Private - Educational Project

## Support

For issues or questions, please contact the development team.
