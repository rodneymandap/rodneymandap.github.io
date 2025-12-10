This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

[![Build](https://github.com/rodneymandap/rodneymandap.github.io/actions/workflows/build.yml/badge.svg)](https://github.com/rodneymandap/rodneymandap.github.io/actions/workflows/build.yml)

## Features

- 📧 **Contact Form** - Production-ready contact form with Resend email integration
- 🛡️ **Spam Protection** - Honeypot field to prevent bot submissions
- ⏱️ **Rate Limiting** - In-memory rate limiting (3 submissions per hour per IP)
- ✅ **Validation** - Client-side and server-side validation
- 🎨 **Modern UI** - Responsive design with Tailwind CSS
- ✨ **Toast Notifications** - User-friendly success/error feedback

## Getting Started

### Prerequisites

- Node.js 14+ or Yarn
- A [Resend](https://resend.com) API key for email functionality

### Installation

1. Clone the repository:

```bash
git clone https://github.com/rodneymandap/rodneymandap.github.io.git
cd rodneymandap.github.io
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables:

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your settings:

```env
# Required: Get your API key from https://resend.com/api-keys
RESEND_API_KEY=re_your_api_key_here

# Optional: Email where contact form submissions will be sent
CONTACT_EMAIL=your-email@example.com

# Optional: The "from" email address (must be verified in Resend)
FROM_EMAIL=onboarding@resend.dev

# Optional: Enable auto-reply to form submitters
SEND_AUTO_REPLY=false
```

### Running Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

### Contact Form API

The contact form API is available at `/api/contact`. It accepts POST requests with the following body:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "projectType": "Web Development",
  "message": "Your project details here..."
}
```

**Features:**
- ✅ Server-side validation (name, email, message)
- 🛡️ Honeypot spam protection
- ⏱️ Rate limiting (3 requests per hour per IP)
- 📧 Email notification via Resend
- 🔒 Input sanitization (HTML removal)

### Testing

Run the test suite:

```bash
npm test
# or
yarn test
```

Run specific tests:

```bash
npm run test -- __tests__/contact.test.ts
```

### Building for Production

```bash
npm run build
# or
yarn build
```

This builds the app for production in the `out` folder.

## Deployment

### Vercel (Recommended)

The easiest way to deploy is using the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme):

1. Push your code to GitHub
2. Import the project on Vercel
3. Add environment variables in Vercel dashboard:
   - `RESEND_API_KEY`
   - `CONTACT_EMAIL`
   - `FROM_EMAIL` (optional)
   - `SEND_AUTO_REPLY` (optional)

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

### Environment Variables Setup in Vercel

1. Go to your project settings on Vercel
2. Navigate to "Environment Variables"
3. Add the following variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `RESEND_API_KEY` | Your Resend API key from [resend.com/api-keys](https://resend.com/api-keys) | Yes |
| `CONTACT_EMAIL` | Email address to receive contact form submissions | No (defaults to rodneymandap@gmail.com) |
| `FROM_EMAIL` | Sender email address (must be verified in Resend) | No (defaults to onboarding@resend.dev) |
| `SEND_AUTO_REPLY` | Set to `true` to send auto-reply to submitters | No (defaults to false) |

## Security Features

The contact form includes several security measures:

1. **Rate Limiting**: Prevents abuse by limiting submissions to 3 per hour per IP address
2. **Honeypot Protection**: Hidden field that bots typically fill out, humans don't see
3. **Input Validation**: Both client-side and server-side validation
4. **Input Sanitization**: Removes HTML tags to prevent XSS attacks
5. **CORS Protection**: API route only accepts POST requests

## Project Structure

```
.
├── pages/
│   ├── api/
│   │   ├── contact.ts     # Contact form API endpoint
│   │   └── hello.ts       # Example API route
│   ├── _app.tsx           # App component with analytics
│   └── index.tsx          # Main landing page with contact form
├── components/
│   └── email-template.ts  # Email template (if needed)
├── __tests__/
│   ├── contact.test.ts    # API endpoint tests
│   └── navigation.test.jsx
├── .env.example           # Environment variables template
└── README.md
```

## API Routes

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [Resend Documentation](https://resend.com/docs) - email sending service documentation.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## License

This project is open source and available under the MIT License.
