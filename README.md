# Lichtburg AI Native PMS

This is a demo of an AI-native Property Management System (PMS) built with a modern React stack.

Notably, you can use an agent to find different booking options, which is especially useful when it is not possible to fully comply with a clients request or you need to make a multi-leg booking.

[booking_agent_demo.webm](https://github.com/user-attachments/assets/99d3e799-d81e-4e21-b7ee-899eef3615b5)

## Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start/latest) with [TanStack Router](https://tanstack.com/router/latest)
- **UI & Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [Radix UI](https://www.radix-ui.com/) components
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Deployment**: Configured for Cloudflare (via `@cloudflare/vite-plugin` and `wrangler.jsonc`)

## Getting Started

### Prerequisites

Ensure you have [Bun](https://bun.sh/) installed on your machine.

### Installation

1. Clone the repository and navigate to the project folder.
2. Install dependencies:

```bash
bun install
```

### Running Locally

To start the development server, run:

```bash
bun run dev
```

This will start the Vite dev server. Open the local URL provided in your terminal (usually `http://localhost:5173`) to view the application.

## Environment Variables

This project requires an OpenAI API key to run its AI-native features.

1. `cp .env.sample .env` in the root directory.
2. Add your OpenAI API key:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

## Lichtburg Academy

The **Lichtburg Academy** is an interactive, gamified staff training dashboard. It includes a mock curriculum of courses specifically designed to simulate training for a front office agent working in a German hostel (e.g., Check-in process, handling complaints, fire safety, etc.).
The user is nudged to complete trainings by bubble popping up in the sidebar.

https://github.com/user-attachments/assets/572692ec-af2b-4285-8db7-fb3c1c645848

_Note: The course material in the Academy is AI-generated and is meant solely for mockup and demonstration purposes. It is not necessarily accurate or compliant with actual German regulations._
