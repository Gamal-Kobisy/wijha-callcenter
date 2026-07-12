---
name: team-git
description: Use when writing commit messages, PR descriptions, or generating changelogs.
---

# Git Workflow Standards

## Commit messages
- Format: type(scope): description
- Types: feat, fix, refactor, docs, test, chore, ci
- Scope: the module or area changed (api, ui, auth, db)
- Max 72 chars for subject line
- Body: explain WHY, not what (the diff shows what)

## PR descriptions
Use this template:
### What changed
### Why
### How to test
### Breaking changes (if any)
### Related issues

## Changelogs
- Group by: Added, Changed, Fixed, Removed
- Write for end users, not developers
- Skip internal changes (CI, refactoring, dependency bumps)
