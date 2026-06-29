# Modern Edu Permission Foundation

Modern Edu uses role-based permissions with organization-scoped data access.

Visible UI text remains Uzbek, while permission keys, code, routes, and database names stay English.

## Roles

- `ADMIN`: manages organization-level teachers and reports.
- `TEACHER`: manages students, owned groups, messages, assignments, tests, and group reports.
- `STUDENT`: reads assigned groups, sends allowed messages, submits assignments, and takes assigned tests.

## Permission Format

Permissions use:

```txt
resource:action:scope
```

Examples:

```txt
teacher:create:organization
student:create:organization
group:update:owned
message:create:member
assignment:submit:assigned
test:attempt:assigned
```

## Server Rules

- Use `requirePermission(...)` for protected server pages and mutations.
- Use `assertSameOrganization(...)` before returning organization-scoped records.
- Never rely on frontend navigation visibility as security.
- Route navigation is only a convenience; server-side guards are the source of truth.
