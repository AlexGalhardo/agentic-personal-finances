# Chapter 5: Case Study: theWisePad (Estudo de Caso)

## Core Idea
A deliberately small note-taking REST API (Node.js + TypeScript) is big enough to show every layer and small enough to fit in a book. The entities and use cases never mention the web.

## Frameworks Introduced
- **Start from the use cases, then sketch the entities**: spend a little time on a minimal model (UML as a sketch, not big up-front design), then develop with TDD. The real project had 109 automated tests, mostly unit tests.
- **Develop in vertical slices**: pick one use case and implement it through every layer. The book *presents* the code layer by layer, from the inside out, only because that is easier to teach.
- **Walking Skeleton** (Freeman & Pryce): on a greenfield project, first build a minimal feature end to end with all the chosen technologies, driven by a BDD-style acceptance test. This reduces integration risk early. The book skips it so that it can defer technology decisions until the outer chapters. Deferring details is the alternative strategy, and it has its own benefits.

## Worked Example
Scope:

| # | Use case | Notes |
|---|----------|-------|
| 1 | Sign up | Validate, reject an existing user, hash the password, store, then log in |
| 2 | Sign in | Delegate to the authentication service |
| 3 | Create note | The owner must exist; unique title per owner |
| 4 | Load notes | All notes for a user id |
| 5 | Update note | Title and/or content; uniqueness re-checked |
| 6 | Remove note | Fails if the note does not exist |

The domain is `User` (email, password) and `Note` (title, content, a single owner).

## Key Concepts
- **MVP architecture**: the example is a well-architected first MVP that is meant to keep evolving through refactoring.
- **Scope cut**: password change and user removal are left out on purpose.

## Anti-patterns
- **Big up-front design**: sketch the model, then let TDD refine it.
- **Assuming the example covers every real problem**: concurrency and transactions are explicitly out of scope (see Ch 9).

## Key Takeaways
1. Name the use cases before you write code. They drive the structure.
2. Build in vertical slices even if you explain the system in layers.
3. Choose between a walking skeleton (lower risk) and deferring details (keep options open) on purpose.

## Connects To
- **Ch 6–10**: the implementation of this scope, layer by layer.
