# Rodney's Portfolio Website

## Overview
This is a personal portfolio website for Rodney, a Software Engineer and DevOps Practitioner. The site showcases his professional profile, experience, and skills in a clean, modern design.

## Tech Stack
- **Framework**: Next.js 13.1.5
- **UI Library**: React 18.2.0
- **Styling**: Tailwind CSS 3.2.7
- **Component Library**: Material-UI 4.x
- **Analytics**: Vercel Analytics

## Project Structure
```
├── components/       # React components
├── pages/           # Next.js pages and API routes
│   ├── _app.js     # App wrapper with global styles
│   ├── index.js    # Homepage (main portfolio page)
│   └── api/        # API routes
├── public/         # Static assets (images, icons)
├── styles/         # Global CSS and module styles
└── __tests__/      # Jest test files
```

## Development

### Running Locally
The application is configured to run on port 5000 with host binding to 0.0.0.0 for Replit compatibility:

```bash
npm run dev
# or
yarn dev
```

Access the site at: `http://localhost:5000`

### Build for Production
```bash
npm run build
# or
yarn build
```

This creates a static export in the `out/` directory.

## Replit Configuration

### Workflow
- **Name**: Start application
- **Command**: `npm run dev`
- **Port**: 5000
- **Output**: Webview

### Deployment
- **Type**: Static
- **Build Command**: `npm run build`
- **Public Directory**: `out/`

## Features
- Responsive design optimized for all devices
- Dynamic years of experience calculation
- Professional hero section with profile image
- Tailwind CSS for utility-first styling
- Analytics integration for tracking

## Dependencies Note
The project uses Material-UI v4 with React 18, which shows peer dependency warnings but functions correctly. Install using:

```bash
yarn install
# or
npm install --legacy-peer-deps
```

## Recent Changes (Dec 8, 2024)
- Added Next.js configuration for Replit environment
- Configured dev server to run on 0.0.0.0:5000
- Updated build script to generate static export
- Set up deployment configuration for static hosting
- Installed all dependencies using Yarn
