# Chapter 9: Frameworks & Drivers

## Core Idea
The outermost layer is glue code that makes the inner ports concrete with real technologies: MongoDB repositories, a bcrypt encoder and a JWT token manager. Here the discussion shifts entirely to schemas, connections, hash formats and tokens. That shift is itself the proof that the layering works.

## Frameworks Introduced
- **Simplified Repository**: one interface per aggregate (`UserRepository`, `NoteRepository`) with one concrete class per technology. The full Fowler/Evans Repository with a DataMapper and configurable operations would be overkill at this size.
- **Infrastructure-to-application mapping**: storage structs (`MongodbUser`, which has `_id`) are mapped to application DTOs (`UserData`, which has `id`) by a `withApplicationId` function. Insert a **clone**, because the driver mutates the object it is given.
- **Connection helper**: a single `MongoHelper` (connect, disconnect, getCollection, clearCollection) reuses one client because the driver manages the pool.
- **Concurrency options** (named, not implemented): atomic repository operations, atomic use cases, transactions started in the controller (a lower-level concern), or the **Unit of Work** pattern (it tracks objects changed in a request and commits them together). The choice depends on the kind of conflict, the scale and the technology. The cosmicpython book is recommended reading.
- **ORMs vs Clean Architecture**:
  - Objects and tables are opposites: an object is functions over implicit data, while a data structure is data over implicit functions. So the realistic option is a *data mapper*, not an "object-relational" mapping.
  - ORMs that **annotate domain entities break the Dependency Rule**.
  - ORMs with **separate schema definitions** kept in Frameworks & Drivers are acceptable (examples: SQLAlchemy with UoW and Repository, Prisma).
  - **Active Record on entities is impossible** in CA. Active Record on data structures (the DTOs) is acceptable.
- **Encoder adapter** (`BcryptEncoder`): `encode` delegates to `bcrypt.hash(plain, rounds)` and `compare` delegates to `bcrypt.compare`. The cost factor is configurable (default 10 from the environment). The salt is embedded in the hash `$2b$<cost>$<22-char salt><31-char hash>`.
- **Token adapter** (`JwtTokenManager`): `sign(payload, expiresIn?)` defaults to one month. `verify` returns `Either<Error, Payload>`. The secret is configurable. JWT is stateless, so nothing is stored server-side.

## Key Concepts
- **Glue code**: code whose only job is to adapt a library to a port.
- **Unit of Work**: coordinates the writes and conflict resolution for one business transaction.
- **Schemaless collections**: no up-front schema in MongoDB.

## Mental Models
- If the infrastructure chapter is all technology talk and the inner chapters are all domain talk, the boundaries are right.
- Data mapping is the honest name for what ORMs do. Keep the mapping out of the entities.

## Anti-patterns
- **Returning `null` for not-found results**: the author keeps it as acknowledged debt. Prefer `Either<NotFoundError, T>` or `Option`. `null` is tolerable only when absence is the only possible failure.
- **ORM decorators or Active Record methods on domain entities.**
- **Ignoring concurrency in production**: concurrent edit and delete of the same note has undefined results in the example.

## Key Takeaways
1. One concrete adapter per port per technology. Swapping technology means writing one new adapter.
2. Map storage ids and shapes to application DTOs at the adapter boundary.
3. Keep ORM schemas, if you use an ORM, in this outer layer.
4. Make security parameters (bcrypt cost, JWT secret, expiry) configurable from main.
5. Handle transactions consciously (UoW, atomic operations or controller-level transactions).

## Connects To
- **Ch 7**: the ports implemented here.
- **Ch 10**: factories instantiate these adapters with values from the environment.
