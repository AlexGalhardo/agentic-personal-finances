# Patterns: Clean Architecture in Practice

## Port owned by the inner layer
**When to use**: a use case needs storage, crypto, tokens, email or another external service.
**How**: declare the smallest interface in the use-case layer. Implement it in Frameworks & Drivers. Inject the implementation from main.
**Trade-offs**: adds one type per boundary. Do not add ports inside a single layer.

## Self-validating Value Object + factory method
**When to use**: any constrained domain property (email, password, title).
**How**: private constructor; `create(raw)` validates and returns `Either<InvalidX, X>`; the instance is immutable and compared by value.
**Trade-offs**: more types, but invalid states become unrepresentable and primitive obsession disappears.

## Errors as values (Either)
**When to use**: expected, recoverable failures (invalid input, duplicates, not found).
**How**: return `Left(error)` or `Right(value)` and list the error types in a union. Throw only for truly exceptional conditions and catch only at the entry points.
**Trade-offs**: the signatures are verbose. *Clean Code* prefers exceptions, so this is a stylistic choice.

## DTO across boundaries
**When to use**: whenever data leaves or enters the core.
**How**: use plain structures (`UserData`, `NoteData`, `UpdateNoteRequest`). Rebuild entities from them inside the use case.
**Trade-offs**: the ideal is one DTO per request. Sharing one per aggregate is simpler but carries unused fields.

## Generic UseCase interface
**When to use**: you need uniform controller wiring and cheap stubs.
**How**: a single `perform(request): Promise<any>` that all use cases implement.
**Trade-offs**: loses return typing and allows the wrong use case to be wired. The alternative is a specific interface per use case.

## Template controller by composition
**When to use**: every controller repeats the same steps: check params, call the use case, catch exceptions.
**How**: a `WebController` holds the flow and receives an injected `ControllerOperation {requiredParams, specificOp}`.
**Trade-offs**: an operation with unusual inputs (such as UpdateNote's optional fields) has to do extra checks itself.

## Own HTTP request/response types
**When to use**: you need controllers that are independent of the web framework.
**How**: define `HttpRequest`/`HttpResponse` and helpers (`ok`, `created`, `badRequest`, `forbidden`, `serverError`). Adapt the framework to them in main (`adaptRoute`, `adaptMiddleware`).
**Trade-offs**: one translation function per framework.

## Auth middleware (authenticate + authorize)
**When to use**: protected endpoints.
**How**: require the token and the requester id, verify the token through the `TokenManager` port, and compare the payload id with the requester id. Return 403 on any mismatch and 500 if an exception is caught.
**Trade-offs**: generic errors are a known debt, so add specific error types.

## Storage-to-application mapping
**When to use**: the storage engine has its own id or shape (Mongo's `_id`).
**How**: keep storage structs in the driver layer and map them to DTOs (`withApplicationId`). Clone objects before driver calls that mutate their input.
**Trade-offs**: mapping boilerplate, in exchange for an engine-agnostic core.

## ORM with separate schemas
**When to use**: you want an ORM's safety without polluting the entities.
**How**: keep the schema and mapping definitions in Frameworks & Drivers, optionally with Unit of Work and Repository. Never annotate entities and never use Active Record on them.
**Trade-offs**: more mapping code.

## Unit of Work / transaction placement
**When to use**: concurrent edits, or writes to several aggregates that must succeed together.
**How**: make repository operations atomic, make use cases atomic, start the transaction in the controller, or use a UoW that tracks and commits the changes for one request.
**Trade-offs**: the choice depends on the kind of conflict, the scale and the technology. The example does not implement any of them.

## Factory per component in main
**When to use**: building any concretion.
**How**: write `makeX()` functions that read configuration from the environment. Controller factories compose the use-case factories.
**Trade-offs**: many small files, but a technology swap becomes a one-file change.

## Vertical slices / mini architecture per bounded context
**When to use**: larger systems or microservices.
**How**: modularize by context (Products, Orders, Payments), each with its own layers and possibly its own data store.
**Trade-offs**: duplicated scaffolding. Contexts need explicit interfaces between them.

## Humble Object (front end)
**When to use**: UI logic that is hard to test.
**How**: the presenter formats the data and the view only renders it.
**Trade-offs**: the full CA layering is not justified in the front end.
