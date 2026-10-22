---
name: clean-architecture-in-practice
description: "Knowledge base from \"Arquitetura Limpa na Prática\" (Clean Architecture in Practice) by Otávio Lemos. Use when applying Lemos's frameworks for Clean Architecture layers, the Dependency Rule, ports and adapters, use cases, DTOs and controllers, errors as values, and composition roots, when studying the book, or when referencing its concepts."
---

<!-- argument-hint: [topic, framework name, or chapter number] -->

# Arquitetura Limpa na Prática (Clean Architecture in Practice)
**Author**: Otávio Lemos | **Pages**: ~117 | **Chapters**: 11 | **Edition**: Feb 2022 (Portuguese, TypeScript/Node.js examples) | **Generated**: 2026-10-21

## How to Use This Skill

- **Without arguments**: load the core frameworks below.
- **With a topic**: ask about `ports`, `either`, `controllers` or `orm`. I find and read the relevant chapter.
- **With a chapter**: ask for `ch07` and I load that chapter.
- **Browse**: ask "what chapters do you have?"

When you ask about a topic that the Core Frameworks below do not cover, I read the relevant chapter file before answering.

---

## Core Frameworks & Mental Models

**1. The Dependency Rule (the one non-negotiable).** Source-code dependencies point only inward, toward higher-level policy. Inner code never names anything declared outside it: functions, types or **data structures** (framework requests, ORM rows). Every other choice in the book is a negotiable trade-off. This one is not.

**2. Five layers, inside to outside.**
| Layer | Holds | Changes when |
|---|---|---|
| Entities | Critical domain data and rules, self-validating Value Objects, factory methods | The domain itself changes |
| Use Cases | Application rules, the "dance of the entities", **ports** (repositories, Encoder, TokenManager, AuthenticationService), DTOs | The way the app operates changes |
| Interface Adapters | Technology-free controllers, own `HttpRequest`/`HttpResponse` types, middleware, presenters | The delivery protocol changes |
| Frameworks & Drivers | Glue adapters that call drivers directly (Mongo repos, bcrypt, JWT) | A technology changes |
| Main & Configuration (the author's 5th layer) | Factories, environment, routes, framework adapters, entry point | Deployment or wiring changes |
"The further out, the more detail." Main is the "dirty" lowest-level policy that knows everything, and nothing depends on it.

**3. Strict adapter placement.** An adapter that calls an external library directly is infrastructure (Frameworks & Drivers), even though it is "an adapter". Only generic or intermediate adapters and the technology-free controllers live in Interface Adapters.

**4. Interfaces only at boundaries.** "Clean Architecture is not filling the system with interfaces." Use a port when a call crosses an architectural boundary or you need a test stub. Inside one layer, call directly. Under ~5k LOC, question whether you need the full layering at all.

**5. The port belongs to its consumer.** The use-case layer declares the smallest interface it needs. The outer layers implement it, and main injects it (Dependency Inversion through constructor injection).

**6. Fixed rules go in Entities; variable rules go in Use Cases.** "Unique note title per owner" sits in the use case because another app might drop it. If it were immutable domain law it would move into `User` (with `addNote`).

**7. Make illegal states unrepresentable.** Value Objects (Email, Password, Title) have a private constructor and a static `create` that validates and returns `Either<InvalidX, X>`. Instances are immutable. Entities compose these factories. Validate in the domain even if the front end already validated.

**8. Expected errors are values.** `Either<Left=error, Right=success>`, with a union of specific error types, wrapped in `Promise` when async. Exceptions are reserved for the truly exceptional and caught only at the entry points (controller and middleware, mapping to 500). This is a style choice, not a CA mandate.

**9. DTOs at every crossing.** `UserData` and `NoteData` carry data across layers so that entities never leave the core. Ids appear first in the use-case layer, never on entities. Storage shapes (Mongo `_id`) are mapped to DTOs inside the driver adapter.

**10. Thin controllers via composition.** `WebController` does required-param check (400), then calls the injected `ControllerOperation.specificOp`, inside one try/catch (500). Each operation maps use-case results to status codes (201, 200, 403, 400).

**11. A single composition root.** One `makeX()` factory per component reads the environment (DB URL, port, JWT secret, bcrypt cost). Controller factories nest the use-case and service factories. Framework shims (`adaptRoute`, `adaptMiddleware`) translate Express types to your own types.

**12. ORMs and persistence.** ORM annotations on entities break the Dependency Rule. An ORM with separate schemas kept in the driver layer is acceptable. Active Record is impossible on entities and acceptable on DTOs. Handle concurrency deliberately: atomic repository operations, atomic use cases, transactions started in the controller, or a Unit of Work.

**13. Simple, not simplistic.** Separating infrastructure from rules is cheap and always pays off. "It will never change" is as dangerous as "make it fully flexible now".

**14. Process.** Name the use cases first, sketch a minimal model, and drive it with TDD. Build in vertical slices (one use case through every layer). Consider a Walking Skeleton early. Large systems get a small CA per bounded context or microservice. The front end is outer-ring code: use Humble Object/MVP there, not the full layering.

---

## Chapter Index

| # | Title | Key Frameworks |
|---|-------|----------------|
| [ch01](chapters/ch01-introduction.md) | Introduction | What CA is not; interfaces only at boundaries |
| [ch02](chapters/ch02-software-architecture.md) | Software Architecture | Architecture = design; sustainable lead time; domain vs application rules; Screaming Architecture |
| [ch03](chapters/ch03-clean-architecture.md) | The Clean Architecture | Hexagonal, DCI, BCE; Dependency Rule; 5 layers; bounded-context slices; Humble Object |
| [ch04](chapters/ch04-technology-and-patterns.md) | Technology & Patterns | Either for errors; shared folder; Promise<Either> |
| [ch05](chapters/ch05-case-study-thewisepad.md) | Case Study: theWisePad | Use-case-first; vertical slices; Walking Skeleton |
| [ch06](chapters/ch06-entities.md) | Entities | Self-validating Value Objects; factory methods; no ids in the domain |
| [ch07](chapters/ch07-use-cases.md) | Use Cases | Ports; DTOs; generic UseCase; auth service; rule placement |
| [ch08](chapters/ch08-interface-adapters.md) | Interface Adapters | Adapter placement rule; own HTTP types; template controller; auth middleware |
| [ch09](chapters/ch09-frameworks-and-drivers.md) | Frameworks & Drivers | Repository adapters; id mapping; ORM rules; Unit of Work; bcrypt/JWT adapters |
| [ch10](chapters/ch10-main-and-configuration.md) | Main & Configuration | Composition root; factories; route and middleware adapters; environment hygiene |
| [ch11](chapters/ch11-conclusion.md) | Conclusion | Simple, not simplistic |

## Topic Index

- **Active Record** → ch09
- **Adapter placement** → ch08, ch03
- **Authentication / authorization** → ch07, ch08
- **BCE / DCI / Hexagonal** → ch03
- **Composition root / factories** → ch10, ch03
- **Concurrency / transactions / Unit of Work** → ch09
- **Controllers / WebController** → ch08
- **Conway's Law** → ch02
- **Dependency Inversion** → ch02, ch07
- **Dependency Rule** → ch03, ch08, ch09
- **DTOs** → ch07, ch09
- **Either / errors as values** → ch04, ch06, ch07
- **Entities / Value Objects** → ch06, ch02
- **Environment variables (.env)** → ch10
- **Front end / Humble Object / MVP** → ch03
- **Interface Segregation trade-off** → ch07
- **Interfaces: when not to use** → ch01, ch07
- **Lead time / purpose of architecture** → ch02
- **Microservices / bounded contexts** → ch03
- **Middleware** → ch08, ch10
- **null vs Option** → ch09
- **ORMs** → ch09
- **Ports / repositories** → ch07, ch09
- **Screaming Architecture** → ch02
- **shared folder** → ch04
- **TDD / vertical slices / Walking Skeleton** → ch05
- **Use cases (Sign up, Create note, …)** → ch07

## Supporting Files

- [glossary.md](glossary.md): all key terms with definitions
- [patterns.md](patterns.md): all techniques and design patterns
- [cheatsheet.md](cheatsheet.md): placement decisions, interface decisions, smells

---

## Scope & Limits

This skill covers the book's content only. It contains synthesized summaries, not the book text, which is copyrighted. The book's code listings are images, so none was extracted. Code-level details here are reconstructed from the prose. The examples are TypeScript and Node.js. When you apply them in another language (for example Go), translate the principles, not the class shapes. The author presents the book as his own interpretation of Martin's Clean Architecture.
