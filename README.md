# PWA Item Tracker

A Progressive Web App for tracking items with location history and photo support.

## Features

- Add, edit, and view items
- Track location history
- Upload and manage photos
- Search functionality
- Dark mode support
- CSV export
- Offline support
- Mobile-friendly design

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

## Database

The app uses IndexedDB for client-side storage. No additional database setup is required.

Data is persisted in the browser and will remain available even when offline.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
