# Documentation

This directory contains all project documentation organized by context.

## Structure

```
docs/
├── architecture/     # Architecture decisions, project structure, conventions
├── backend/          # Backend-specific documentation
├── frontend/         # Frontend-specific documentation
├── guides/           # How-to guides and tutorials
└── histories/        # User stories and requirements

specs/                # Technical specifications (na raiz do projeto)
└── [feature-id]-[feature-name]/
```

## Documentation Guidelines

### Where to Place Documentation

- **Backend documentation**: `docs/backend/`
  - Environment variables: `docs/backend/ENV.md`
  - Feature documentation: `docs/backend/[feature-name].md`
  - API documentation: `docs/backend/api/`

- **Frontend documentation**: `docs/frontend/`
  - Component documentation: `docs/frontend/components/`
  - Feature documentation: `docs/frontend/[feature-name].md`

- **Architecture decisions**: `docs/architecture/`
  - ADRs (Architecture Decision Records): `docs/architecture/adrs/`
  - Project structure: `docs/architecture/CLAUDE.md`
  - Conventions: `docs/architecture/conventions.md`

- **User stories**: `docs/histories/`
  - Organized by phase: `docs/histories/fase-[n]-[name]/`

- **Technical specifications**: `specs/` (na raiz do projeto, não em `docs/`)
  - Feature specs: `specs/[feature-id]-[feature-name]/`
  - Cada feature tem seu próprio diretório com spec.md, plan.md, tasks.md, etc.

- **Guides and tutorials**: `docs/guides/`
  - Quickstart guides: `docs/guides/quickstart-[topic].md`
  - How-to guides: `docs/guides/how-to-[topic].md`

### Naming Conventions

- Use kebab-case for file names: `email-templates.md`
- Use descriptive names: `authentication-system.md` not `auth.md`
- README.md files are allowed in subdirectories for context-specific documentation

### What Stays in Root

- `README.md` (root) - Main project overview and quick start
- README.md files in code directories (e.g., `apps/backend/src/email/README.md`) - Can stay for local context or be moved to `docs/`

## Rules

- All documentation files (.md) must be placed in `docs/` directory
- Exceptions:
  - Root `README.md` stays in project root
  - `specs/` directory stays in project root (technical specifications)
  - README.md files in code directories can stay for local context
- Documentation should be organized by context (backend, frontend, architecture, etc.)
- Use clear, descriptive file names
- Keep documentation up to date with code changes
