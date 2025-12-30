# Archivo - Project Instructions & Guidelines

> **Archivo** is a cross-platform application (Web & Electron) for bulk file manipulation operations including renaming, moving, and complete folder processing.

---

## Table of Contents

1. [General Rules](#general-rules)
2. [Monorepo Architecture](#monorepo-architecture)
3. [Technology Stack](#technology-stack)
4. [Code Organization](#code-organization)
5. [Styling Guidelines](#styling-guidelines)
6. [Theming System](#theming-system)
7. [Responsive Design](#responsive-design)
8. [Development Workflow](#development-workflow)
9. [Build & Deployment](#build--deployment)

---

## General Rules

### Language Standards

- **All code, comments, documentation, configuration files, and environment variables MUST be written in English.**
- Use clear, descriptive naming conventions in English for all identifiers.
- All commit messages must be in English.

### Version Policy

- **Always use the latest stable versions** of all libraries and dependencies.
- Regularly audit and update dependencies using `npm outdated` or equivalent tools.
- Document any version constraints with clear justification.

---

## Monorepo Architecture

### ⚠️ CRITICAL: Code Sharing Principle

**All code MUST be shared between platforms (Web & Electron) whenever possible.**

- Business logic, UI components, hooks, utilities, and styles should be written ONCE in a shared package.
- Platform-specific code should be minimal and isolated in dedicated packages.
- The monorepo structure enables seamless code reuse and consistent behavior across platforms.

### Root Architecture

The project follows a **monorepo architecture** using npm/pnpm workspaces to manage multiple sub-projects from a single root.

```
archivo/                          # Root workspace
├── package.json                  # Root package.json (workspaces config)
├── pnpm-workspace.yaml           # pnpm workspaces configuration
├── turbo.json                    # Turborepo configuration (optional)
├── tsconfig.base.json            # Shared TypeScript configuration
├── .eslintrc.base.js             # Shared ESLint configuration
├── .prettierrc                   # Shared Prettier configuration
├── .github/                      # GitHub & Copilot configuration
│   └── copilot-instructions.md   # This file (Copilot agent instructions)
├── README.md                     # Project documentation
│
├── packages/                     # Shared packages
│   ├── shared/                   # @archivo/shared - Core shared code
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── components/       # Shared React components
│   │       ├── hooks/            # Shared React hooks
│   │       ├── interfaces/       # Shared TypeScript interfaces
│   │       ├── types/            # Shared TypeScript types
│   │       ├── services/         # Shared business logic
│   │       ├── utils/            # Shared utilities
│   │       ├── stores/           # Shared state management
│   │       └── index.ts          # Package exports
│   │
│   ├── ui/                       # @archivo/ui - Shared UI library
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── components/       # UI components (MUI-based)
│   │       ├── styles/           # SCSS variables, mixins, themes
│   │       │   ├── _variables.scss
│   │       │   ├── _mixins.scss
│   │       │   ├── _theme.scss
│   │       │   └── global.scss
│   │       ├── theme/            # MUI theme configuration
│   │       └── index.ts          # Package exports
│   │
│   └── file-operations/          # @archivo/file-operations - File manipulation logic
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── interfaces/       # File operation interfaces
│           ├── operations/       # Rename, move, copy operations
│           ├── adapters/         # Platform adapters (web/electron)
│           └── index.ts          # Package exports
│
├── apps/                         # Application targets
│   ├── web/                      # Web application
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx          # Web entry point
│   │       ├── App.tsx           # Root component
│   │       ├── adapters/         # Web-specific adapters
│   │       └── views/            # Web-specific views (if any)
│   │
│   └── electron/                 # Electron application
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── electron-builder.json # Electron builder config
│       └── src/
│           ├── main/             # Electron main process
│           │   ├── main.ts       # Main process entry
│           │   ├── preload.ts    # Preload script
│           │   └── ipc/          # IPC handlers
│           ├── renderer/         # Electron renderer (React app)
│           │   ├── main.tsx      # Renderer entry point
│           │   ├── App.tsx       # Root component
│           │   └── adapters/     # Electron-specific adapters
│           └── shared/           # Shared between main/renderer
│
└── scripts/                      # Build and utility scripts
    ├── build-all.ts              # Build all packages
    ├── dev.ts                    # Start development mode
    └── clean.ts                  # Clean build artifacts
```

### Workspace Commands

All operations are orchestrated from the **root** of the monorepo:

```bash
# Install all dependencies (from root)
pnpm install

# Development
pnpm dev                    # Start all in dev mode
pnpm dev:web                # Start web app only
pnpm dev:electron           # Start Electron app only

# Build
pnpm build                  # Build all packages and apps
pnpm build:shared           # Build shared packages
pnpm build:web              # Build web app
pnpm build:electron         # Build Electron app

# Testing
pnpm test                   # Run all tests
pnpm test:shared            # Test shared packages
pnpm test:web               # Test web app
pnpm test:electron          # Test Electron app

# Code Quality
pnpm lint                   # Lint all packages
pnpm format                 # Format all packages
pnpm type-check             # Type-check all packages

# Package-specific commands
pnpm --filter @archivo/shared <command>
pnpm --filter @archivo/web <command>
pnpm --filter @archivo/electron <command>
```

### Code Sharing Strategy

| Code Type         | Location                   | Usage                         |
| ----------------- | -------------------------- | ----------------------------- |
| UI Components     | `packages/ui`              | Shared across all apps        |
| Business Logic    | `packages/shared`          | Shared across all apps        |
| File Operations   | `packages/file-operations` | Shared with platform adapters |
| Styles/Themes     | `packages/ui/styles`       | Shared across all apps        |
| Web-specific      | `apps/web/src`             | Web app only                  |
| Electron-specific | `apps/electron/src`        | Electron app only             |

### Platform Adapters Pattern

To handle platform differences while sharing code, use the **Adapter Pattern**:

```typescript
// packages/file-operations/src/interfaces/IFileSystemAdapter.ts
export interface IFileSystemAdapter {
  readDirectory(path: string): Promise<FileEntry[]>;
  renameFile(oldPath: string, newPath: string): Promise<void>;
  moveFile(source: string, destination: string): Promise<void>;
  // ... other operations
}

// apps/web/src/adapters/WebFileSystemAdapter.ts
// Uses File System Access API

// apps/electron/src/renderer/adapters/ElectronFileSystemAdapter.ts
// Uses Electron IPC to communicate with Node.js
```

---

## Technology Stack

| Category        | Technology                     | Notes                                |
| --------------- | ------------------------------ | ------------------------------------ |
| Language        | TypeScript (latest)            | Strict mode enabled                  |
| Framework       | React 19.x                     | Latest stable version                |
| Build Tool      | Vite 6.x                       | Fast, modern build tooling           |
| UI Library      | Material UI (MUI) 6.x          | Latest version with SCSS integration |
| Styling         | SCSS                           | With CSS Modules support             |
| Desktop         | Electron (latest)              | For cross-platform desktop support   |
| Testing         | Vitest + React Testing Library | Unit and integration testing         |
| Linting         | ESLint 9.x                     | With TypeScript and React plugins    |
| Formatting      | Prettier                       | Consistent code formatting           |
| Package Manager | npm / pnpm                     | Prefer pnpm for performance          |

---

## Code Organization

### File Structure Principles

1. **One class/interface per file** - Never define more than one class or interface in the same file.
2. Each file should have a single responsibility.
3. Use descriptive file names matching the exported class/interface name.

### Naming Conventions

| Type           | Convention         | Example                |
| -------------- | ------------------ | ---------------------- |
| Components     | PascalCase         | `FileRenamer.tsx`      |
| Hooks          | camelCase with use | `useFileOperations.ts` |
| Interfaces     | PascalCase with I  | `IFileOperation.ts`    |
| Types          | PascalCase         | `FileOperationType.ts` |
| Services       | PascalCase         | `FileService.ts`       |
| Utilities      | camelCase          | `stringUtils.ts`       |
| Constants      | SCREAMING_SNAKE    | `FILE_CONSTANTS.ts`    |
| SCSS Variables | kebab-case         | `_variables.scss`      |

### Recommended Folder Structure

> **Note:** See [Monorepo Architecture](#monorepo-architecture) for the complete project structure.
> The structure below applies to each package/app within the monorepo.

```
# For shared packages (packages/shared, packages/ui)
src/
├── components/             # Reusable UI components
│   ├── common/             # Generic components (Button, Modal, etc.)
│   └── features/           # Feature-specific components
├── hooks/                  # Custom React hooks
├── interfaces/             # TypeScript interfaces (one per file)
├── types/                  # TypeScript types (one per file)
├── services/               # Business logic and API services
├── stores/                 # State management
├── utils/                  # Utility functions
└── index.ts                # Package exports

# For UI package (packages/ui)
src/
├── components/             # MUI-based components
├── styles/                 # Global styles and SCSS variables
│   ├── _variables.scss     # All SCSS variables
│   ├── _mixins.scss        # SCSS mixins
│   ├── _theme.scss         # Theme-related styles
│   └── global.scss         # Global styles
├── theme/                  # MUI theme configuration
└── index.ts                # Package exports

# For apps (apps/web, apps/electron/renderer)
src/
├── adapters/               # Platform-specific adapters
├── views/                  # App-specific views
├── App.tsx                 # Root component
└── main.tsx                # Application entry point
```

---

## Styling Guidelines

### SCSS Variables File

**All style definitions MUST use variables defined in `_variables.scss` whenever possible.**

```scss
// src/styles/_variables.scss

// ============================================
// COLOR PALETTE
// ============================================
$color-primary: #1976d2;
$color-primary-light: #42a5f5;
$color-primary-dark: #1565c0;

$color-secondary: #9c27b0;
$color-secondary-light: #ba68c8;
$color-secondary-dark: #7b1fa2;

$color-error: #d32f2f;
$color-warning: #ed6c02;
$color-info: #0288d1;
$color-success: #2e7d32;

// ============================================
// TYPOGRAPHY
// ============================================
$font-family-primary: 'Roboto', 'Helvetica', 'Arial', sans-serif;
$font-family-mono: 'Roboto Mono', monospace;

$font-size-xs: 0.75rem; // 12px
$font-size-sm: 0.875rem; // 14px
$font-size-md: 1rem; // 16px
$font-size-lg: 1.125rem; // 18px
$font-size-xl: 1.25rem; // 20px
$font-size-2xl: 1.5rem; // 24px
$font-size-3xl: 2rem; // 32px

// ============================================
// SPACING
// ============================================
$spacing-unit: 8px;
$spacing-xs: $spacing-unit * 0.5; // 4px
$spacing-sm: $spacing-unit; // 8px
$spacing-md: $spacing-unit * 2; // 16px
$spacing-lg: $spacing-unit * 3; // 24px
$spacing-xl: $spacing-unit * 4; // 32px
$spacing-2xl: $spacing-unit * 6; // 48px

// ============================================
// BREAKPOINTS (Mobile-first)
// ============================================
$breakpoint-xs: 0;
$breakpoint-sm: 600px;
$breakpoint-md: 900px;
$breakpoint-lg: 1200px;
$breakpoint-xl: 1536px;

// ============================================
// SHADOWS
// ============================================
$shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
$shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
$shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
$shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);

// ============================================
// BORDERS
// ============================================
$border-radius-sm: 4px;
$border-radius-md: 8px;
$border-radius-lg: 12px;
$border-radius-full: 9999px;

// ============================================
// Z-INDEX LAYERS
// ============================================
$z-index-dropdown: 1000;
$z-index-sticky: 1020;
$z-index-fixed: 1030;
$z-index-modal-backdrop: 1040;
$z-index-modal: 1050;
$z-index-popover: 1060;
$z-index-tooltip: 1070;

// ============================================
// TRANSITIONS
// ============================================
$transition-fast: 150ms ease-in-out;
$transition-normal: 250ms ease-in-out;
$transition-slow: 350ms ease-in-out;
```

### SCSS Best Practices

1. **Import variables at the top of every SCSS file:**

   ```scss
   @use 'styles/variables' as *;
   ```

2. **Use CSS Modules for component-specific styles:**

   ```scss
   // FileCard.module.scss
   .container {
     padding: $spacing-md;
     border-radius: $border-radius-md;
   }
   ```

3. **Never use hardcoded values** - always reference variables.

---

## Theming System

### Theme Architecture

The application MUST support theming from the initial design phase.

1. **MUI Theme Integration:**
   - Create a custom MUI theme that references SCSS variables.
   - Support both light and dark modes.
   - All theme properties should be configurable.

2. **CSS Custom Properties for Runtime Theming:**

   ```scss
   :root {
     --color-primary: #{$color-primary};
     --color-background: #ffffff;
     --color-surface: #f5f5f5;
     --color-text-primary: rgba(0, 0, 0, 0.87);
     --color-text-secondary: rgba(0, 0, 0, 0.6);
   }

   [data-theme='dark'] {
     --color-background: #121212;
     --color-surface: #1e1e1e;
     --color-text-primary: rgba(255, 255, 255, 0.87);
     --color-text-secondary: rgba(255, 255, 255, 0.6);
   }
   ```

3. **Theme Properties to Include:**
   - Color palette (primary, secondary, error, warning, info, success)
   - Background colors (default, paper, elevated)
   - Text colors (primary, secondary, disabled)
   - Typography (font families, sizes, weights, line heights)
   - Spacing scale
   - Border radii
   - Shadows/Elevation
   - Transitions and animations
   - Component-specific overrides

---

## Responsive Design

### Breakpoint System

The application MUST be fully responsive across all screen sizes:

| Breakpoint | Min Width | Target Devices                    |
| ---------- | --------- | --------------------------------- |
| xs         | 0         | Small phones                      |
| sm         | 600px     | Phones, small tablets             |
| md         | 900px     | Tablets                           |
| lg         | 1200px    | Laptops, desktops                 |
| xl         | 1536px    | Large desktops, high-res displays |

### Responsive SCSS Mixins

```scss
// src/styles/_mixins.scss

@mixin respond-to($breakpoint) {
  @if $breakpoint == 'sm' {
    @media (min-width: $breakpoint-sm) {
      @content;
    }
  } @else if $breakpoint == 'md' {
    @media (min-width: $breakpoint-md) {
      @content;
    }
  } @else if $breakpoint == 'lg' {
    @media (min-width: $breakpoint-lg) {
      @content;
    }
  } @else if $breakpoint == 'xl' {
    @media (min-width: $breakpoint-xl) {
      @content;
    }
  }
}

// Usage example:
.container {
  padding: $spacing-sm;

  @include respond-to('md') {
    padding: $spacing-md;
  }

  @include respond-to('lg') {
    padding: $spacing-lg;
  }
}
```

### Responsive Design Guidelines

1. **Mobile-first approach** - Start with mobile styles, enhance for larger screens.
2. Use MUI's responsive utilities (`useMediaQuery`, `Grid`, `Box` with `sx`).
3. Test on actual devices, not just browser resize.
4. Ensure touch targets are at least 44x44 pixels on mobile.
5. Consider different input methods (touch, mouse, keyboard).

---

## Development Workflow

### Code Quality Tools

1. **ESLint Configuration:**
   - Enable strict TypeScript rules
   - React hooks rules
   - Import sorting
   - Accessibility (jsx-a11y)

2. **Prettier Configuration:**

   ```json
   {
     "semi": true,
     "singleQuote": true,
     "tabWidth": 2,
     "trailingComma": "es5",
     "printWidth": 100
   }
   ```

3. **TypeScript Configuration:**
   - Enable strict mode
   - No implicit any
   - Strict null checks

### Testing Requirements

- **Minimum test coverage: 80%**
- Unit tests for all utility functions
- Component tests for all UI components
- Integration tests for critical user flows
- Use `vitest` for unit tests
- Use `@testing-library/react` for component tests

### Git Workflow

1. Use conventional commits: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`
2. Create feature branches from `main`
3. Require PR reviews before merging
4. Run linting and tests in CI pipeline

---

## Build & Deployment

### Build Tools

- **Vite** for development and production builds
- **pnpm workspaces** for monorepo management
- **Turborepo** (optional) for build caching and orchestration
- Configure separate builds for:
  - Shared packages (`packages/*`)
  - Web application (`apps/web`)
  - Electron main process (`apps/electron/main`)
  - Electron renderer process (`apps/electron/renderer`)

### Environment Configuration

```
# Root level
.env                      # Shared environment variables

# App-specific
apps/web/.env.development     # Web development
apps/web/.env.production      # Web production
apps/electron/.env.development # Electron development
apps/electron/.env.production  # Electron production
```

### Build Commands (from root)

```bash
# Install dependencies
pnpm install              # Install all workspace dependencies

# Development (orchestrated from root)
pnpm dev                  # Start all apps in dev mode
pnpm dev:web              # Start web app only
pnpm dev:electron         # Start Electron app only

# Production builds
pnpm build                # Build all packages and apps
pnpm build:packages       # Build shared packages only
pnpm build:web            # Build web app
pnpm build:electron       # Build Electron app (packaged)

# Testing
pnpm test                 # Run all tests across workspace
pnpm test:coverage        # Run tests with coverage report
pnpm test --filter @archivo/shared  # Test specific package

# Code Quality
pnpm lint                 # Lint all packages
pnpm lint:fix             # Lint and auto-fix
pnpm format               # Format all files with Prettier
pnpm type-check           # TypeScript check all packages

# Utilities
pnpm clean                # Clean all build artifacts
pnpm deps:update          # Update all dependencies
```

---

## Platform-Specific Considerations

### Web Platform

- Progressive Web App (PWA) support
- File System Access API for browser file operations
- Fallback mechanisms for unsupported browsers

### Electron Platform

- Native file system access via Node.js
- IPC communication between main and renderer
- Auto-updates support
- Platform-specific behaviors (Windows, macOS, Linux)

---

## Version History

| Version | Date       | Author | Changes                                      |
| ------- | ---------- | ------ | -------------------------------------------- |
| 1.0.0   | 2024-12-30 | -      | Initial instructions                         |
| 1.1.0   | 2024-12-30 | -      | Added monorepo architecture and code sharing |
| 1.2.0   | 2024-12-30 | -      | Moved to .github/copilot-instructions.md     |

---

_This document should be reviewed and updated as the project evolves._
