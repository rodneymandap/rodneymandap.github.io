# Copilot Instructions for AI Agents

## Project Overview
- This is a Next.js project (React-based, SSR/SSG support) using TypeScript and Tailwind CSS.
- Main UI code is in `pages/` (for routes) and `components/` (for reusable UI logic).
- API endpoints are in `pages/api/` and follow Next.js API route conventions.
- Styling is handled via Tailwind CSS (`tailwind.config.js`, `postcss.config.js`, and `styles/`).

## Key Patterns & Conventions
- All new code should use TypeScript (`.ts`/`.tsx`).
- Use functional React components and hooks (e.g., `useState`, `useEffect`).
- Data and config objects (e.g., skills, projects) are defined as typed arrays/objects at the top of files.
- API route handlers use `NextApiRequest` and `NextApiResponse` types from `next`.
- Navigation and layout are handled in `components/navigation.js` and `pages/_app.tsx`.
- Use Tailwind utility classes for all styling; avoid inline styles and CSS modules unless necessary.

## Developer Workflows
- **Development:** `npm run dev` (or `yarn dev`) starts the local server at `localhost:3000`.
- **Build:** `npm run build` (or `yarn build`) for production builds.
- **Test:** Run `npm test` (Jest, see `__tests__/`).
- **Lint/Format:** Use `eslint` and `prettier` if configured.
- **Deploy:** Deploys are handled via Vercel (see README for details).

## Integration & External Dependencies
- Uses Vercel Analytics (`@vercel/analytics/react`) in `_app.tsx`.
- No custom server; all backend logic should be in `pages/api/`.
- No database or persistent storage by default; API routes are stateless.

## Examples
- See `pages/index.tsx` for main page structure, data-driven rendering, and component usage.
- See `pages/api/hello.ts` for a minimal API route example.
- See `components/email-template.ts` for a typed, reusable component.

## Special Notes
- Keep all code and config cross-platform (no OS-specific logic).
- Prefer explicit types and interfaces for all exported functions and objects.
- Do not introduce new global state; use React context or props for state sharing.

---

For more, see the project [README.md].
