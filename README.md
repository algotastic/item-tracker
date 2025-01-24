# Orderly

A modern inventory management system for organizing and tracking your items with detailed location tracking and tagging capabilities.

## Features

- **Location Tracking**
  - Hierarchical location system with Rooms and Spots
  - Track item movement history
  - Required room assignment with optional spot specification

- **Smart Tagging**
  - Create and assign tags to items
  - Intelligent tag suggestions while typing
  - Filter items by multiple tags

- **Advanced Search & Filtering**
  - Real-time search functionality
  - Filter by location (Room/Spot)
  - Multi-tag filtering
  - Combine search with filters

- **Item Management**
  - Add and edit items with rich details
  - Upload and manage multiple photos
  - Track location history
  - Batch export capabilities

- **User Experience**
  - Mobile-first responsive design
  - Dark mode support
  - Offline functionality
  - Progressive Web App (PWA)

## Running Locally

### Using Docker (Recommended)

1. Clone the repository
2. Run with Docker Compose:
```bash
npm run docker:dev
```

The app will be available at `http://localhost:4321`

### Manual Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:4321`

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run docker:dev` - Run development server in Docker
- `npm run docker:build` - Build Docker image
- `npm run docker:prod` - Run production build in Docker

### Technology Stack

- Astro.js
- React
- TypeScript
- Tailwind CSS
- IndexedDB for storage
- Service Workers for offline support

## Data Storage

Orderly uses IndexedDB for client-side storage with the following structure:

- Items: Main inventory items with metadata
- Rooms: Available rooms for item storage
- Spots: Specific locations within rooms
- Location History: Track item movements
- Tags: Automatically managed through items

Data persists in the browser and remains available offline.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
