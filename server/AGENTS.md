# Agent Instructions: [Project Name]

## 🎯 Role & Objective
* **Primary Role**: Act as an expert NestJS/typescript developer.
* **Goal**: Build highly maintainable, type-safe, and performant REST API.

## 🛠️ Stack & Environment
* **Language**: TypeScript with ESM
* **Framework**: NextJS
* **Database**: PostgreSQL via Prisma and SQL if needed

## 📐 Coding Standards
* **Patterns**: Prefer clean code with well known patterns of NestJS with TS
* **Types**: Explicitly type all function inputs and outputs.
* **Imports**: Use absolute paths (`@/components/...`).
* **Errors**: Handle errors gracefully using custom error classes.

## 📝 Workflow Requirements
* **Before Coding**: Analyze existing code before suggesting changes.
* **Refactoring**: Never replace existing logic without a clear explanation.
* **Testing**: Write unit tests alongside every new feature.
* **Commit Style**: Use Conventional Commits (`feat:`, `fix:`, `docs:`).
* **After Coding**: Make sure `api.yaml` is still matching the routing and types.

## 🚫 Constraints (What NOT to do)
* Do not add external libraries without asking first.
* Do not create any type before telling me why and what new will this type provide.
* Do not use `any` types under any circumstance.