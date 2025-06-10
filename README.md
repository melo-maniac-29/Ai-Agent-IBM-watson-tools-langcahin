# AI-Agent

A Next.js application that uses AI to process and interact with various content sources including YouTube and wxflows.

## Overview

This project is built using Next.js 15 and integrates several AI technologies including LangChain, LangGraph, and various models from Anthropic, OpenAI and Google's Generative AI. It provides an interface for AI-powered interactions with multimedia content across different platforms.

## Features

- AI-powered content analysis from multiple sources
- Clerk authentication with robust security measures
- Streaming responses using AI models
- Convex backend integration
- wxflows SDK integration for advanced workflow automation
- End-to-end encryption for sensitive data
- Multi-factor authentication support

## Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **AI/ML**: LangChain, LangGraph, Google Generative AI, Anthropic, OpenAI
- **Authentication**: Clerk with OAuth 2.0 and JWT
- **Backend**: Convex
- **Workflow Automation**: wxflows SDK
- **Security**: TLS encryption, CSRF protection, rate limiting
- **Styling**: Tailwind CSS with Radix UI components


## Getting Started

### Prerequisites

- Node.js 18+ installed
- PNPM package manager
- API keys for various services (Clerk, OpenAI, etc.)
- 

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/melo-maniac-29/YT-Ai-Agent.git
   cd YT-Ai-Agent
   ```

2. Install dependencies
   ```bash
   pnpm install
   ```

3. Set up environment variables
   Create a `.env.local` file in the root directory with the following variables:
   ```
   # Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   
   # AI Models
   OPENAI_API_KEY=your_openai_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   GOOGLE_API_KEY=your_google_api_key
   
   # Other configurations
   NEXT_PUBLIC_CONVEX_URL=your_convex_url
   ```

4. Start the development server
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

```
/app
  /api            # API endpoints including AI chat streaming
  /components     # UI components
  /lib            # Utility functions and AI setup
  /pages          # Page components
/public           # Static assets
/styles           # Global styles
```

## Workflow

1. **Authentication Flow**:
   - Users log in through Clerk authentication
   - Authenticated sessions are maintained across the application

2. **AI Processing Flow**:
   - LangGraph manages the conversational flow
   - API endpoints handle AI model selection and parameter configuration
   - Streaming responses are delivered to the frontend interface

3. **Data Management**:
   - Convex handles data persistence and real-time updates
   - User preferences and history are stored securely

## Deployment

The project is configured for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Configure the environment variables in the Vercel dashboard
3. Deploy the application

## Troubleshooting

### Common Issues

- **ESLint TypeScript Errors**: If you encounter ESLint errors related to TypeScript (like the `no-explicit-any` rule), either provide proper types or adjust the ESLint configuration in `.eslintrc.js`.

- **Build Failures**: Ensure all dependencies are correctly installed and environment variables are properly set.

## Security

Security is a top priority for this application. For a complete overview of our security practices, vulnerability reporting procedures, and compliance information, please refer to the [SECURITY.md](./SECURITY.md) file.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
