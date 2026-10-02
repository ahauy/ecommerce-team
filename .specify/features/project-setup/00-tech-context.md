# Tech Context — Ecommerce Team Project

> Mọi subagent PHẢI đọc file này trước khi thực hiện bất kỳ công việc nào.
> Không hallucinate stack — chỉ dùng các công nghệ liệt kê ở đây.

## Tech Stack

| Layer               | Công nghệ                            | Ghi chú                                      |
| ------------------- | ------------------------------------ | -------------------------------------------- |
| **Language**        | TypeScript                           | Strict mode                                  |
| **Backend**         | NestJS (Node.js) + Mongoose ODM      | REST API, versioned `/api/v1/`               |
| **Frontend**        | React 18 + Vite + TypeScript         | Template: `donezombie/react-boider-plate-ts` |
| **UI**              | Tailwind CSS + shadcn/ui (Radix UI)  | Component library                            |
| **State**           | Zustand                              | Global state (auth, cart)                    |
| **Data Fetching**   | TanStack Query (React Query) + Axios | API calls                                    |
| **Routing**         | React Router v6                      | Private routes, lazy loading                 |
| **Forms**           | Formik + Yup                         | Validation                                   |
| **Database**        | MongoDB (Mongoose)                   |                                              |
| **File Storage**    | Cloudinary                           | Product images, max 5/SP                     |
| **Payment**         | VNPay Sandbox                        | HMAC-SHA512 verify                           |
| **Package Manager** | pnpm (FE) / npm (BE)                 |                                              |
| **Port FE**         | 5173 (Vite default)                  |                                              |
| **Port BE**         | 3000                                 |                                              |

## API Contract

- Base URL: `/api/v1/`
- Response wrapper: `{ success: boolean, data: T, message: string }`
- Error: `{ success: false, message: string, errors?: [...] }`
- Auth header: `Authorization: Bearer <accessToken>`

## Business Rules Tham chiếu

- `docs/project-ecommerce/03-requirements.md` — BR-XXX đầy đủ
- `docs/project-ecommerce/05-database-erd.md` — MongoDB schemas
- `docs/project-ecommerce/06-api-contract.md` — endpoints

## Naming Conventions

- BE: camelCase variables, PascalCase classes, UPPER_SNAKE_CASE constants
- FE: camelCase hooks/functions, PascalCase components
- API: noun plural, kebab-case, no verbs in URL
- Git: `feature/<name>` branches, Conventional Commits

## RBAC

| Role     | Key permissions       |
| -------- | --------------------- |
| Guest    | Public endpoints only |
| customer | Own cart, own orders  |
| admin    | All resources         |
