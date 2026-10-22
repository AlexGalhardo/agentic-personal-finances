# Cheatsheet: Clean Architecture in Practice

## Where does this code go?
- Rule that holds even without software, and is fixed across apps → **Entities**
- Rule about how this app automates the domain, or one that may vary per app → **Use Cases**
- Translating a request into a use-case call, mapping results to status codes, technology-free middleware → **Interface Adapters**
- Code that imports a driver or library (DB, bcrypt, JWT, HTTP framework) → **Frameworks & Drivers**
- `new Concrete()`, environment reading, routes, framework setup, `main` → **Main & Configuration**
- Stable, language-level utilities (Either) → **shared** (not a layer)
- Ids → introduced at **Use Cases** (DTOs and repositories), never on entities

## Should I add an interface?
| Situation | Decision |
|---|---|
| The call crosses a layer boundary inward to outward (use case to DB, crypto, token) | Yes: a port owned by the inner layer |
| You need to stub a slow or external service in tests | Yes |
| Caller and callee are in the same layer | No: call it directly |
| "Maybe someday we swap it", and it does not cross a boundary | No: that is cargo cult |
| The system is under ~5k LOC | Question the whole layering |

## Error handling
- Expected failure → return `Left(SpecificError)`
- Not found and absence is the only failure → `null` is tolerated, but `Either`/`Option` is preferred
- Truly exceptional failure → let it throw and catch it **only** in the controller or middleware, mapping to 500

## Controller status mapping (example)
| Outcome | HTTP |
|---|---|
| Missing required param | 400 |
| Created | 201 |
| Updated or OK | 200 |
| Existing user / auth failure / not owner | 403 |
| Other domain or application error | 400 |
| Exception | 500 |

## Interface granularity trade-offs
| Option | Pro | Con |
|---|---|---|
| One generic `UseCase.perform` | Easy wiring and stubs | Untyped results, wrong-wiring risk |
| One interface per use case | Type-safe | More types |
| One repository interface per aggregate | Simple | Violates ISP; split it when it bloats |

## Smells
- An inner package imports a framework, driver or ORM → Dependency Rule violation
- Entities have ids, ORM annotations or `save()` → persistence leaked into the domain
- Entities are passed out of the use case → use DTOs
- Controllers contain if-chains of business logic → move the logic into the use case
- try/catch inside use cases or entities → errors should be values
- Request DTOs with many optional fields → branching complexity; prefer full replacement
- `new` scattered outside main → missing factories
- Interfaces everywhere, even within a layer → overengineering
- Folder names announce the framework, not the use cases → not a screaming architecture

## Defaults the author commits to
- Validate in entities, even if the front end already validated
- Value Objects are immutable and built only through `create`
- bcrypt cost 10 and a JWT expiry of one month, both configurable from the environment
- `.env` is never committed; commit `.env.example` (dotenv-safe)
- Build in vertical slices; explain in layers
