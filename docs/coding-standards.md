# Coding standards

The standards reviewer applies this file to each branch diff. Implementers don't read it.

## Tests

- A test runs the code and checks behaviour through the module's public interface.
- No test that restates a constant or a config value.
- No test that reads source files to check their text or order.
- No mock that makes the failure under test impossible. Mock only what crosses a process or network boundary.
- A bug fix comes with a test that failed before the fix.

## Modules

- Prefer deep modules: a small interface over a larger implementation.
- Don't export a helper only to test it.
- Code that changes together lives together.
- Reuse or extend an existing helper; don't copy it.

## Comments and suppressions

- No comment that restates the code, narrates a change or justifies a workaround. Fix the cause.
- A comment is for a constraint the code can't show, in one or two lines.
- No lint or type suppression and no skipped or focused test, unless the user approved it and the PR names it.

## Errors

- No swallowed error: handle it, or let it surface with context.
- No fallback that reports a failure as success.

## Project-specific

(Empty. `/retro` adds lines here.)
