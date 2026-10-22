# Chapter 4: Technology and Adopted Patterns (Tecnologia e padrões adotados)

## Core Idea
Even the purest inner layer has to commit to some language. The two cross-cutting choices in the book are **errors returned as values (an `Either` type)** and **async operations returning `Promise<Either<...>>`**.

## Frameworks Introduced
- **Either for expected errors**:
  - `Either<L, R>` holds errors on the **left** and success on the **right**. It has `isLeft()` / `isRight()` and a `.value`, and is built with the `left()` / `right()` helpers.
  - Union types list the possible errors. For example, `User.create(email, password)` returns `Either<InvalidEmailError | InvalidPasswordError, User>`.
  - Use it for **foreseeable** failures (invalid input, an existing user). Reserve exceptions for **truly exceptional** situations (out of memory, a lost connection). In the whole example app there is exactly one try/catch in `WebController` and one in a middleware.
  - Rationale: try/catch gives GOTO-like control flow, because any statement can jump to the handler. Wirfs-Brock's *Object Design* also recommends returning errors. The author notes that *Clean Code* prefers exceptions, so this is a design choice, not a CA rule.
- **The `shared` folder**: it holds stable, language-level utilities such as `Either`. It is **not a layer**. Any layer may depend on it because it is treated like the platform itself. Only **stable** code may go here. Volatile technology must not.
- **Async signature reading**: `Promise<Either<ExistingUserError | InvalidEmailError | InvalidPasswordError, AuthenticationResult>>` reads as "I promise to return either these errors or an authentication result".
- **Free functions are allowed**: use stand-alone pure functions when you only need a function, not a class (the author notes that Feathers disagrees).
- **Explicit interfaces despite structural typing**: TypeScript would accept any structurally matching object, but the author still declares `implements X` to make the intent visible.

## Key Concepts
- **Structural typing**: types are sets of values, and the same shape means the same type.
- **Event loop / single thread**: Node.js runs blocking I/O asynchronously. Lippert's breakfast analogy: toast and eggs are interleaved by one cook.
- **Promise / async / await**: lets you write code that looks synchronous over async operations.

## Mental Models
- "Expected failure is data; unexpected failure is an exception."
- `shared` is an extension of the platform: put something there only if you would never want to change it.

## Anti-patterns
- **Throwing for validation failures** and catching them in many places.
- **Putting volatile libraries in `shared`**: that makes every layer depend on a detail.

## Key Takeaways
1. Model expected errors in the return type so that callers must handle them.
2. Catch exceptions only at the outermost entry points (controllers and middleware).
3. Every potentially blocking port operation is async.
4. A shared kernel of stable utilities is fine. A shared kernel of frameworks is not.

## Connects To
- **Ch 6**: factory methods return `Either`.
- **Ch 7**: use cases return `Promise<Either<...>>`.
- **Ch 8**: `WebController` holds the single top-level try/catch.
