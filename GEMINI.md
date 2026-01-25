# Atlas Flow

Atlas Flow is a modern, full-stack web application designed to streamline and manage complex logistics and supply chain operations for freight forwarders in morrocco (specifically small companies). This comprehensive platform integrates various modules to handle customer relationship management (CRM), dossier and shipment tracking, financial operations, and user management, making it an all-in-one solution for logistics companies.

The application is built with a focus on a reactive and intuitive user experience, on business expertise led design, and business knowledge driven value and processes and workflows, leveraging a powerful tech stack that includes React, Vite, and TypeScript. The UI is crafted with `shadcn/ui` and Tailwind CSS, ensuring a clean, modern, and responsive design. State management is handled by Zustand, providing a simple and scalable solution for managing application state.

## Key Features

- **Customer Relationship Management (CRM):** Manage client information, activities, billing, and documents in a centralized location.
- **Dossier Management:** Track and manage shipment dossiers with detailed progress, manifests, and operational feeds.
- **Financial Dashboard:** Oversee financial operations with features for creating and managing invoices.
- **Quote Builder:** A powerful tool for creating and managing quotes, including a pricing table and route selector.
- **User Directory:** Manage user roles and permissions with a comprehensive user directory.

## Tech Stack

- **Frontend:**
  - **Framework:** [React](https://react.dev/)
  - **Build Tool:** [Vite](https://vitejs.dev/)
  - **Language:** [TypeScript](https://www.typescriptlang.org/)
  - **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
  - **Styling:** [Tailwind CSS](https://tailwindcss.com/)
  - **State Management:** [Zustand](https://github.com/pmndrs/zustand)
  - **Routing:** [React Router](https://reactrouter.com/)
- **Backend (assumed from dependencies):**
  - **Database:** [Supabase](https://supabase.io/) (PostgreSQL)

## Getting Started

To get started with Atlas Flow, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/atlas-flow.git
   cd atlas-flow
   ```

2. **Install dependencies:**
   Make sure you have Node.js and npm installed. Then run the following command to install the project dependencies:
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root of the project and add the necessary environment variables, including your Supabase URL and API key.

4. **Run the development server:**
   Start the development server with Hot Module Replacement (HMR) enabled:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

5. **Build for production:**
   To create a production build, run the following command:
   ```bash
   npm run build
   ```
   The optimized and minified files will be generated in the `dist` directory.

## Available Scripts

- **`npm run dev`:** Starts the development server.
- **`npm run build`:** Builds the application for production.
- **`npm run lint`:** Lints the codebase using ESLint.
- **`npm run preview`:** Serves the production build locally for preview.
