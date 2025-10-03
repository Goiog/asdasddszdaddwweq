# Overview

Chinese Cards is a full-stack web application that gamifies learning Chinese vocabulary through a card collection system. Users can open packs containing Chinese words with varying rarity levels, build their collection, and explore their acquired vocabulary. The app features a modern trading card game (TCG) style interface with pack opening animations, card rarity systems (common, rare, epic, legendary), and collection management.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client is built with React 18 using TypeScript and Vite for development tooling. The UI framework is built on top of shadcn/ui components with Radix UI primitives, providing a consistent design system with Tailwind CSS for styling. The application uses Wouter for client-side routing and TanStack Query for server state management and caching.

**Key Frontend Decisions:**
- **Component Library Choice**: shadcn/ui was chosen for its flexibility and modern design patterns, allowing customization while maintaining consistency
- **State Management**: TanStack Query handles server state with automatic caching, while local state uses React's built-in hooks and localStorage for persistence
- **Routing**: Wouter provides a lightweight routing solution suitable for the simple two-page navigation structure
- **Styling**: Tailwind CSS with CSS custom properties enables consistent theming and responsive design

## Backend Architecture
The server uses Express.js with TypeScript, structured as a REST API. The architecture follows a layered pattern with route handlers, storage abstraction, and utility services. Currently implemented with an in-memory storage layer that can be easily swapped for a database implementation.

**Key Backend Decisions:**
- **Storage Abstraction**: IStorage interface allows switching between in-memory and database implementations without changing business logic
- **Pack Opening Logic**: Server-side pack opening ensures fair randomization and prevents client-side manipulation
- **File Processing**: Chinese word data is parsed from a structured text file format for easy content management

## Data Storage Solutions
The application uses Drizzle ORM configured for PostgreSQL with Neon serverless database. The schema includes users, Chinese words, user card collections, and pack opening history. Local storage is used for client-side persistence when database is not available.

**Database Schema:**
- **users**: Basic user authentication and identification
- **chinese_words**: Core vocabulary data with rarity assignments based on frequency
- **user_cards**: Junction table tracking user's collected cards with counts
- **pack_openings**: Audit trail of all pack opening events

## External Dependencies

**Database & Storage:**
- Neon Serverless PostgreSQL for production data storage
- Drizzle ORM for type-safe database operations and migrations
- Local storage fallback for development and offline functionality

**UI & Development:**
- shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Vite for fast development and optimized production builds
- TanStack Query for server state management and API caching

**Authentication & Validation:**
- Zod for runtime type validation and schema definitions
- bcrypt for password hashing (if authentication is implemented)
- express-session with PostgreSQL session store for session management

**Content & Assets:**
- Chinese vocabulary data loaded from structured text files
- Image assets served statically with fallback to generated placeholders
- Font loading from Google Fonts for typography consistency