# React + Vite + TypeScript Boilerplate

A modern, production-ready React boilerplate built with Vite, TypeScript, and Tailwind CSS. This template includes everything you need to kickstart your next React project with best practices, beautiful UI components, and a robust development setup.

## 🎉 Features

### Core Technologies

- **React 18** - A JavaScript library for building user interfaces
- **Vite** - Next-generation frontend build tool for blazing-fast development
- **TypeScript** - Type-safe JavaScript for better developer experience
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **shadcn/ui** - Beautifully designed, accessible components built with Radix UI

### State Management & Data Fetching

- **Zustand** - Lightweight state management solution
- **TanStack Query (React Query)** - Powerful data synchronization for React
- **Axios** - Promise-based HTTP client

### Routing & Navigation

- **React Router v6** - Declarative routing for React applications
- **Private Routes** - Protected route implementation
- **Lazy Loading** - Code splitting for optimal performance

### Forms & Validation

- **Formik** - Build forms without tears
- **Yup** - JavaScript schema validation
- **Custom Formik Fields** - Pre-built form components (Input, Select, Checkbox, Radio, Switch, DateTimePicker)

### Internationalization

- **i18next** - Internationalization framework
- **react-i18next** - React bindings for i18next
- **Multi-language Support** - English (en) and Vietnamese (vi) included

### UI Components

- **Radix UI** - Unstyled, accessible component primitives
- **Lucide React** - Beautiful icon library
- **Toast Notifications** - react-toastify integration
- **Date & Time Pickers** - Custom date-time picker components
- **Loading States** - Skeleton and loading components

### Developer Experience

- **ESLint** - Code linting with TypeScript support
- **Prettier** - Code formatting with Tailwind CSS plugin
- **Husky** - Git hooks for quality assurance
- **Path Aliases** - Clean imports with `@/` alias
- **Error Boundaries** - Graceful error handling
- **TypeScript Strict Mode** - Type safety out of the box

### Additional Features

- **Theme Provider** - Light/dark theme support (ready for extension)
- **Sidebar Provider** - Responsive sidebar management
- **Authentication Provider** - Authentication state management
- **Custom Hooks** - Reusable hooks for common patterns
- **Helper Utilities** - Common helper functions
- **HTTP Service** - Centralized API service layer

## ⚙️ Prerequisites

Make sure you have the following installed on your development machine:

- **Node.js** (version 16 or above)
- **pnpm** (recommended) or **npm** (package manager)

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd react-boider-plate-ts-1
```

### 2. Install dependencies

Using pnpm (recommended):

```bash
pnpm install
```

Or using npm:

```bash
npm install
```

### 3. Start the development server

```bash
pnpm dev
```

The application will be available at `http://localhost:5173` (or the port shown in your terminal).

## 📜 Available Scripts

- `pnpm dev` - Starts the development server with hot module replacement
- `pnpm build` - Builds the production-ready code for deployment
- `pnpm lint` - Runs ESLint to analyze and lint the code
- `pnpm preview` - Starts the Vite development server in preview mode to test the production build

## 📁 Project Structure & Page-Centric Architecture

The frontend strictly adheres to a **Page-Centric Architecture (Screaming Architecture & Colocation)**:

```
src/
├── @types/                  # Global TypeScript type definitions
├── assets/                  # Static assets (images, icons, etc.)
├── components/              # GENUINELY SHARED components only (used across 2+ pages)
│   ├── commonIcons/         # Reusable SVG icon components
│   ├── customFieldsFormik/  # Reusable Formik form field components (InputField, FormikField, etc.)
│   ├── dialogs/             # Shared dialogs/modals (DialogConfirm, etc.)
│   ├── Footer/              # Shared footer component
│   ├── Navbar/              # Shared navigation bar component
│   ├── Sidebar/             # Shared responsive sidebar
│   ├── ui/                  # shadcn/ui primitive accessible components
│   ├── AuthShell.tsx        # Shared auth layout wrapper
│   ├── PageWrapper.tsx      # Shared page wrapper
│   └── PrivateRoute.tsx     # Route protection guard
├── consts/                  # Global constants and route definitions
├── helpers/                 # Shared helper utility functions (toast, common, slugify)
├── HOCs/                    # Higher-Order Components
├── hooks/                   # SHARED custom React hooks (used across 2+ pages)
├── i18n/                    # Internationalization configuration and translations
├── interfaces/              # Shared domain TypeScript interfaces
├── layouts/                 # Page layout wrappers (DefaultLayout, etc.)
├── pages/                   # Feature Pages (Each page is a self-contained module)
│   ├── <PageName>/
│   │   ├── components/      # UI components used ONLY by this page
│   │   ├── services/        # API calls used ONLY by this page
│   │   ├── hooks/           # Custom / TanStack Query hooks used ONLY by this page
│   │   ├── dialogs/         # Dialogs / Modals used ONLY by this page
│   │   ├── schemas/         # Formik + Yup validation schemas for this page
│   │   ├── types.ts         # Types/DTOs scoped to this page
│   │   └── index.tsx        # Page entry component
├── providers/               # Global Context Providers (Auth, Theme, Sidebar)
├── services/                # SHARED API service layer only (used across 2+ pages)
│   ├── apiClient.ts         # Axios client instance with auth interceptors
│   ├── auth.service.ts      # Authentication service
│   ├── user.service.ts      # User profile & shop management service
│   └── category.service.ts  # Category service (shared across AdminCategoryPage & CategoryNav)
├── stores/                  # Zustand stores (authStore, cartStore)
└── styles/                  # Global CSS styles & Tailwind configuration
```

### 📐 Mandatory Frontend Architectural Rules

1. **Locality / Colocation Principle**:
   - Every page owns its own `components/`, `services/`, `hooks/`, `dialogs/`, `schemas/`, and `types.ts`.
   - **Shared Only When Truly Shared**: DO NOT place any component, hook, dialog, or service into root `src/components/`, `src/services/`, or `src/hooks/` unless it is actively imported by **two or more distinct pages**.
   - If an artifact is only used by one page, it **MUST** reside within that page's directory.
2. **Form Handling: Formik + Yup**:
   - All forms must use **Formik** (`<Formik>`, `<Form>`, `Field` or `FormikField`) paired with **Yup** for schema validation.
   - Form schemas must be placed in `schemas/<feature>.schema.ts` within the page.
3. **Data Fetching: TanStack Query**:
   - All remote data fetching and server mutations must be managed via **TanStack Query** (`useQuery`, `useMutation`).
   - Query keys must be structured (`[domain, entity, id/filter]`).
   - Mutations must automatically invalidate related queries upon success.
4. **Design Tokens & Anti-AI-Slop Governance**:
   - Adhere strictly to `frontend/DESIGN.md`: universal pill buttons (`rounded-full` / `9999px`), two-canvas polarity, Neue Haas Grotesk / Inter (`ss03` font features), and subtle hairlines.


## 🎨 UI Components

This boilerplate includes a comprehensive set of UI components from shadcn/ui:

- Accordion, Alert, Alert Dialog, Avatar, Badge
- Button, Calendar, Card, Checkbox, Collapsible
- Command, Context Menu, Dialog, Drawer, Dropdown Menu
- Hover Card, Input, Label, Loading, Menubar
- Navigation Menu, Popover, Progress, Radio Group
- Scroll Area, Select, Separator, Sheet, Skeleton
- Slider, Switch, Table, Tabs, Textarea
- Toast, Toggle, Tooltip

All components are fully typed and customizable.

## 🌐 Internationalization

The project supports multiple languages out of the box:

- **English (en)** - Default language
- **Vietnamese (vi)** - Additional language

To add more languages:

1. Create a new folder in `src/i18n/` (e.g., `fr/`)
2. Add translation files (e.g., `shared.json`)
3. Update `src/i18n/config.ts` to include the new language

## 🔐 Authentication

The boilerplate includes:

- Authentication provider for managing auth state
- Private route protection
- Login, Forgot Password, and Change Password pages
- Role-based access control (HOC: `withCheckRole`)

## 📝 Form Handling

Pre-built Formik field components are available:

- `InputField` - Text input
- `SelectField` - Dropdown select
- `CheckBoxField` - Checkbox input
- `RadioField` - Radio button group
- `SwitchBoxField` - Toggle switch
- `DateTimePickerField` - Date and time picker

All fields are integrated with Yup validation.

## 🛠️ Configuration

### Path Aliases

The project uses path aliases for cleaner imports:

- `@/` - Points to `src/`

Example:

```typescript
import Button from "@/components/ui/button";
import { useStores } from "@/stores/useStores";
```

### Tailwind CSS

Tailwind is configured with:

- Custom color scheme
- CSS variables for theming
- Animation utilities
- Custom utilities

### Vite

Vite is configured with:

- React plugin
- Path alias resolution
- Optimized build settings

## 📦 Key Dependencies

### Core

- `react` & `react-dom` - React library
- `react-router-dom` - Routing
- `typescript` - Type safety

### UI & Styling

- `tailwindcss` - CSS framework
- `@radix-ui/*` - UI primitives
- `lucide-react` - Icons
- `class-variance-authority` - Component variants

### State & Data

- `zustand` - State management
- `@tanstack/react-query` - Data fetching
- `axios` - HTTP client

### Forms

- `formik` - Form management
- `yup` - Validation

### Utilities

- `date-fns` - Date manipulation
- `lodash` - Utility functions
- `moment` - Date/time handling
- `query-string` - URL query parsing

## 🔧 Development Tips

1. **Adding New Routes**: Update `src/App.tsx` with your new routes
2. **Adding Components**: Use the shadcn/ui CLI or manually add to `src/components/ui/`
3. **API Calls**: Use the `httpService` in `src/services/httpService.ts`
4. **State Management**: Create stores in `src/stores/` using Zustand
5. **Custom Hooks**: Add reusable hooks in `src/hooks/`

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

If you encounter any issues or have questions, please open an issue on the repository.

---

**Happy Coding! 🚀**
