# Agent Guidelines — Single Source of Truth

This repository uses Junie (JetBrains autonomous programmer) for assisted development.

- This file is the single source of truth for agent guidelines and responsibilities across this project.
- Project-specific build, testing, and development instructions are documented in `.junie/guidelines.md`, which must align with the principles here.

Principles
- Safety: Make minimal, reversible changes and preserve behavior unless explicitly requested.
- Mode discipline: Follow the interaction mode rules defined by the orchestration platform.
- Traceability: Prefer changes that are easy to review; reflect significant decisions in docs/commit messages.
- Consistency: Adhere to the repository’s tooling and code style.

If a conflict arises between various docs, this file prevails for agent behavior. For human developer workflows and deeper project documentation, see `README.md` and `docs/`.