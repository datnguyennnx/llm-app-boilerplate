# Frontend - LLM Chat Application

A modern, responsive chat application built with Next.js 14, featuring real-time message streaming, conversation history, and Google OAuth authentication.

## Tech Stack

-   **Framework:** Next.js 14 (App Router)
-   **Language:** TypeScript
-   **Styling:** Tailwind CSS
-   **UI Components:** shadcn/ui
-   **State Management:** React Query 5
-   **Authentication:** Google OAuth
-   **Real-time Updates:** Server-Sent Events (SSE)

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication routes
│   ├── chat/              # Chat interface routes
│   │   ├── _components/   # Chat-specific components
│   │   ├── _lib/          # Chat-specific hooks and utilities
│   │   └── [id]/          # Dynamic chat routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Shared components
│   ├── auth/             # Authentication components
│   ├── common/           # Common UI components
│   ├── layout/           # Layout components
│   ├── svg/              # SVG assets
│   └── ui/               # shadcn/ui components
└── lib/                  # Shared utilities
    ├── config/           # Configuration
    ├── context/          # React contexts
    ├── hooks/            # Custom hooks
    ├── types/            # TypeScript types
    └── utils/            # Utility functions
```

## Features

-   **Real-time Chat**

    -   Message streaming
    -   Conversation history
    -   Markdown support
    -   Code syntax highlighting

-   **Authentication**

    -   Google OAuth integration
    -   Protected routes
    -   Persistent sessions

-   **UI/UX**
    -   Responsive design
    -   Dark mode support
    -   Loading states
    -   Error handling
    -   Toast notifications

## Getting Started

### Prerequisites

-   Node.js 18+ or Bun 1.0+
-   Backend service running (see backend README)

### Environment Variables

Create a `.env.local` file:

```bash
NEXT_PUBLIC_AUTH_LOGIN_URL=http://localhost:8000/auth/login
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### Installation

```bash
# Install dependencies
bun install
# or
bun install

# Start development server
bun run dev
# or
bun dev
```

The application will be available at `http://localhost:3000`.

## Development

### Code Style

-   ESLint configuration extends Next.js core web vitals
-   Prettier for code formatting
-   TypeScript for type safety

### Key Commands

```bash
# Development
bun run dev          # Start development server

# Building
bun run build        # Build for production
bun start           # Start production server

# Code Quality
bun run lint        # Run ESLint
bun run format      # Format code with Prettier
```

### Component Guidelines

1. **File Organization**

    - Group related components in directories
    - Use index.ts for exports
    - Keep components focused and modular

2. **Naming Conventions**

    - PascalCase for components
    - camelCase for functions/variables
    - Use descriptive names

3. **Type Safety**

    - Define interfaces/types for props
    - Use TypeScript strict mode
    - Avoid any type

4. **State Management**
    - Use React Query for server state
    - Local state with useState/useReducer
    - Context for global state

### Performance Optimization

-   Implement proper code splitting
-   Optimize images and assets
-   Use React.memo where appropriate
-   Implement proper caching strategies

## Docker Support

The frontend can be run in a Docker container:

```bash
# Build image
docker build -t llm-app-frontend .

# Run container
docker run -p 3000:3000 llm-app-frontend
```

## Contributing

1. Follow the established code style
2. Write meaningful commit messages
3. Update documentation as needed
4. Test changes thoroughly

## License

This project is proprietary and confidential.
