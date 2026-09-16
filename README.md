# Improvement pipeline

Build a web app called "Improvement Pipeline" for a financial operations team.

PURPOSE: Team members submit process improvement ideas, they get scored and prioritised automatically, and progress is tracked from idea to implementation.

CORE FEATURES:

1. A submission form where a team member enters: idea title, description, which process it affects (dropdown: Cash Processing, Client Reporting, Reconciliation, Client Onboarding, Other), estimated time saved per week, and estimated effort to implement (Low/Medium/High).

2. An AI-powered scoring feature: when an idea is submitted, use an AI call to generate an "Impact Score" (1-10) and a one-sentence rationale, based on the time saved vs effort tradeoff and the process area. Show this clearly on each idea card.

3. A Kanban-style board with four columns: Submitted, Under Review, In Progress, Implemented. Ideas can be dragged between columns.

4. A dashboard view showing: total ideas submitted, total estimated hours saved per week across all "Implemented" ideas, and a simple bar chart of ideas by process area.

5. Pre-populate with 8 realistic dummy ideas across different process areas and pipeline stages, with realistic financial operations language (e.g. "Automate daily cash reconciliation exception flagging", "Standardise client onboarding document checklist").

DESIGN: Clean, professional, financial services aesthetic. Navy blue and white primary colours (or seen what are BNY colours and apply them). Card-based layout. Should look credible enough to show to a bank executive.

Use React with a clean component structure. Store data in local state (no backend needed for this demo).

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5f137dc6-f782-42e0-8b80-a0b2186f98b1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
