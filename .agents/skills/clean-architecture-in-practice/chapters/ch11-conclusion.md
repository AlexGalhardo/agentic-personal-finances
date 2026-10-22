# Chapter 11: Conclusion (Conclusão)

## Core Idea
"Clean Architecture" is software architecture plus a minimum of common sense, just as "clean code" should simply be "code". Build architectures that are **simple, but not simplistic** (a phrase from the foreword by Maurício Aniche).

## Frameworks Introduced
- **Simple vs simplistic** (from the foreword): the reaction against J2EE-era over-complexity led to "do the simplest thing". Pushed too far, that produces simplistic systems that cost as much to evolve as the old over-engineered ones. Some decisions are cheap and always pay off: separate infrastructure from business rules, and keep controllers cohesive and delegating.
- **"It will never change" is as dangerous as "make it fully flexible from day one"** (Aniche). Databases rarely change, but whole components often do. Isolation mainly keeps the rest of the code from being polluted by details such as caching or storage.

## Key Takeaways
1. Resistance to clean architectures resembles the early resistance to Dijkstra's GOTO letter. The author expects clean structure to become the norm.
2. The minimum discipline is cohesive, encapsulated classes and deliberate decisions about what may depend on what.
3. Expect continuous refactoring. The example's known debts (null returns, generic middleware errors, a complex UpdateNote) are left visible on purpose.

## Connects To
- **Ch 1**: the "what CA is not" warnings.
- **Ch 2**: sustainable lead time as the goal.
