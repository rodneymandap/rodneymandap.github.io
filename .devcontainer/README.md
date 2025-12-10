# Devcontainer Configuration for GitHub Codespaces

This directory contains the configuration for GitHub Codespaces and VS Code Remote Containers development environment.

## What's Included

### Base Image
- **Node.js 20** with TypeScript support (using Microsoft's official devcontainer image)
- Pre-configured for Next.js development

### VS Code Extensions
The following extensions are automatically installed:
- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **Tailwind CSS IntelliSense** - Tailwind CSS class name completion
- **TypeScript** - Enhanced TypeScript support
- **npm IntelliSense** - npm package auto-completion
- **Path IntelliSense** - File path auto-completion
- **Auto Rename Tag** - Automatically rename paired HTML/JSX tags
- **Auto Close Tag** - Automatically close HTML/JSX tags
- **Better Comments** - Improved comment highlighting
- **Code Spell Checker** - Spell checking for code

### Ports
- **Port 3000**: Development server (automatically forwarded and notified)
- **Port 5000**: Production server (forwarded but no notification)

### Automatic Setup
When you open this project in a Codespace or VS Code Remote Container:
1. Dependencies are automatically installed via `yarn install`
2. The environment is ready for immediate development

## Usage

### Starting Development Server
```bash
yarn dev
```
The development server will be available at `http://localhost:3000`

### Building for Production
```bash
yarn build
```

### Running Tests
```bash
yarn test
```

### Linting
```bash
yarn lint
```

### VS Code Tasks
You can also use VS Code tasks (Terminal > Run Task...):
- Install Dependencies
- Start Development Server
- Build Production
- Start Production Server
- Run Tests
- Run Linter

## Local Development with Remote Containers

If you're using VS Code with the Remote Containers extension:
1. Open the project folder in VS Code
2. Press `F1` and select "Remote-Containers: Reopen in Container"
3. Wait for the container to build and start
4. Start developing!

## GitHub Codespaces

To use this with GitHub Codespaces:
1. Navigate to the repository on GitHub
2. Click the "Code" button
3. Select "Open with Codespaces"
4. Click "New codespace"
5. Wait for the environment to set up
6. Start developing!
