# Chapter 7: Use Cases (Casos de Uso)

## Core Idea
Use cases implement the application business rules. They orchestrate entities and talk to the outside world **only through ports (interfaces) that the use-case layer owns**, which is where the Dependency Inversion happens.

## Frameworks Introduced
- **One generic `UseCase` interface** with a single `perform(request)` method. It makes controller wiring and stubbing easy. The trade-off is weak typing (the return type is `Promise<any>`) and the risk of injecting the wrong use case at composition time. The safer alternative is a specific interface per use case.
- **Ports defined in this layer**:
  - `UserRepository` and `NoteRepository` (find, add, findAll, update, remove), all async.
  - `Encoder`: `encode(plain)` and `compare(plain, hashed)`.
  - `TokenManager`: `sign(payload, expires?)` and `verify(token)`.
  - `AuthenticationService`: `auth(params)` returns `AuthenticationResult {accessToken, id}`, or a user-not-found or wrong-password error.
- **DTOs (`UserData`, `NoteData`)**: plain data structures that carry data across layers so that **domain objects are never handled outside the core**. Adding a field does not break every caller. Ideally there is one DTO per request. The author uses one per aggregate for simplicity (for example `UpdateNoteRequest`).
- **Authentication is application logic, not a use case.** `CustomAuthentication` lives in this layer and depends on three ports (repository, encoder, token manager). Concrete hashing and JWT come later.
- **Domain rule vs application rule placement**: "one note title per owner" is put in the use case because it may vary between applications. If it were a fixed domain rule, it would move into `User`, which would then hold its notes, with an `addNote` that checks for duplicates. **Fixed rules go in Entities. Rules that might vary go in Use Cases.**
- **Pragmatic ISP violation**: one lean interface per repository instead of many role interfaces. Split them only when they bloat (the author notes Martin does the same).

## Worked Example
**SignUp.perform(userData)**:
1. `User.create(email, password)`. On `Left`, return the error (InvalidEmail or InvalidPassword).
2. `userRepo.findByEmail`. If the user exists, return `Left(ExistingUserError)`.
3. `encoder.encode(password)`, then `userRepo.add({email, hashed})`.
4. `authService.auth({email, password})` and return its `Right(AuthenticationResult)`.

**CreateNote**: the owner must exist (`UnregisteredOwnerError`), then `User.create` and `Note.create` (the dance of the entities; the title may be invalid), then check the title is unique for the owner (`ExistingTitleError`), then `noteRepo.add`.

**UpdateNote**: it got complex because title and content are optional. The suggested refactor is to always send both fields and use a single `update` that replaces the note.

**RemoveNote**: find, then remove, or return `UnexistingNoteError`.

## Key Concepts
- **Dance of the entities**: use cases create entities and call their methods to reach a goal.
- **Dependency Inversion**: the high-level use case and the low-level adapter both depend on the port, and the port is owned by the high-level side.
- **Dependency injection**: concretions are passed in through constructors.
- **Stub**: a fake port implementation used to test a use case in isolation.

## Mental Models
- If a use case needs something external, define the smallest port that does the job and let the outer layers implement it.
- Accept small speculative additions such as `findAll` only when they cost almost nothing, and be honest that it is speculation.
- Optional request fields multiply branches. Prefer full-replacement updates.

## Anti-patterns
- **Passing entities across layers**: use DTOs instead.
- **Use cases importing a DB driver, bcrypt or a JWT library.**
- **Storing plain-text passwords.**
- **Partial-update requests with many optional fields**, which make the use case harder to read.

## Key Takeaways
1. The use-case layer owns the interfaces it needs.
2. DTOs in and out. Entities stay inside.
3. Expected failures are typed `Left` values.
4. Put rules that vary between applications here, and fixed domain rules in Entities.
5. Choose interface granularity (generic or per use case, one repository interface or segregated ones) deliberately, and refactor when it starts to hurt.

## Connects To
- **Ch 6**: the entities being orchestrated.
- **Ch 8**: controllers call `perform`.
- **Ch 9**: the adapters that implement these ports.
