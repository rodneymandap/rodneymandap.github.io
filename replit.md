# Rodney Jan Mandap - Portfolio Website

## Overview
This is a personal portfolio website for Rodney Jan Mandap, a Freelance Django Developer. The site showcases his professional profile, Django/Python expertise, and freelance services in a modern dark-themed design.

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
- Personal branding with logo placeholder (/public/logo.png)
- Hero section featuring "Rodney Jan Mandap" prominently
- Freelance Django Developer positioning
- Skills showcase focused on Django, Python, REST APIs
- Featured projects section with Django-focused examples
- Contact form for project inquiries
- Dark theme with indigo/purple accent colors
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
- Complete portfolio redesign with dark theme
- Personalization with "Rodney Jan Mandap" branding throughout
- Logo placeholder integration in navbar and footer (shows "RJM" fallback)
- Updated content to reflect freelance Django developer focus
- Hero section with name, tagline, and floating tech icons
- About section highlighting freelance services
- Skills section with Django, Python, PostgreSQL focus
- Projects section with Django-focused freelance examples
- Contact form updated for project inquiries
- Added Next.js configuration for Replit environment
- Configured dev server to run on 0.0.0.0:5000
- Updated build script to generate static export
- Set up deployment configuration for static hosting

## Branding
- **Name**: Rodney Jan Mandap
- **Title**: Freelance Django Developer
- **Logo**: /public/logo.png (placeholder - shows "RJM" initials as fallback)
- **Primary Colors**: Indigo/Purple gradient
- **Theme**: Dark mode (dark-950 background)
