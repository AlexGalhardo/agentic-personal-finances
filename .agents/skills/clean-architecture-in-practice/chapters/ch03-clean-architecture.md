# Chapter 3: The Clean Architecture (A Arquitetura Limpa)

## Core Idea
Concentric layers, with the most abstract policy in the middle and the most concrete details outside, held together by one rule: **source-code dependencies point only inward**.

## Frameworks Introduced
- **Hexagonal Architecture / Ports & Adapters** (Cockburn): the core must not leak outward. It talks to the world through **ports** (standardized connectors defined as interfaces, like USB or HDMI), and **adapters** fit specific devices to those ports. The same core can be driven by users, programs, tests or scripts, and can run without its real database or devices.
- **DCI (Data, Context, Interaction)** (Reenskaug & Coplien): *Data* is the domain model, *Interaction* is the system operations (use cases, which Martin calls "interactors"), and *Context* is the runtime network of objects playing *roles*, for example "source account" and "destination account".
- **BCE (Boundary, Control, Entity)** (Jacobson): *Entity* is the persisted domain objects, *Boundary* is the interaction with external actors, and *Control* is the use-case process and the application logic.
- **Four properties of these architectures**: independent of frameworks (frameworks are tools at the periphery), testable (rules are tested without UI, database or web server, and every layer can be tested in isolation), independent of the UI, and independent of the database.
- **The Dependency Rule**: nothing in an inner circle may name anything declared in an outer circle. That covers functions, classes, variables and **data structures** (for example, framework or database row types).
- **The layers** (inside to outside):
  1. **Entities**: critical, enterprise-wide business rules. They are the least likely to change when something external changes.
  2. **Use Cases**: application-specific rules. They orchestrate the flow of data to and from entities. This is "the dance of the entities". Use cases change when the way the application operates changes, but not when the database, UI or framework changes.
  3. **Interface Adapters**: convert data between the format that suits the use cases and the format that suits external agents. This is the home of the whole MVC (presenters, views, controllers). All SQL is confined here and beyond. External services such as email are reached through a high-level service interface.
  4. **Frameworks & Drivers**: the DB, the web framework and the tools. Mostly glue code. "The database is a detail; the web is a detail."
  5. **Main & Configuration** (the author's addition as a fifth layer): main, the factories, the strategies, route configuration and environment. It is the "dirty" lowest-level policy that knows everything, wires concretions to interfaces, and starts the system. Nothing depends on it except the OS.
- **"The further out, the more detail."**
- **Mini clean architecture per bounded context**: modularize by *vertical slice* (Products, Orders, Payments) as well as by layer. Each slice or microservice can hold its own small CA. Messaging is just another detail.
- **Front end**: it already sits in the outer, technology-bound ring. Do not replicate all the layers there. Apply SOLID and use **Humble Object / MVP**: the *Presenter* formats data (for example, Date to string) and is easy to test, while the *View* only displays it and is kept as dumb as possible.

## Key Concepts
- **Port**: an interface that the core owns and outer layers implement or call.
- **Adapter**: converts one technology's calls or data into port calls or data.
- **Interactor**: Martin's term for a use-case object.
- **Humble Object**: split hard-to-test code (the view) from testable logic (the presenter).
- **Bounded Context** (DDD): the unit for vertical modularization.

## Mental Models
- Think of the core as a device and the infrastructure as plug-ins that can be plugged, unplugged and swapped.
- Evidence from industry (as reported by the author): Netflix moved from a JSON API to GraphQL in about two hours by writing one new repository adapter and changing one line. Uber DOMA and iFood use similar decoupling.
- Structure and infrastructure both matter. A decoupled structure makes infrastructure strategies such as caching and replication easier to apply.

## Anti-patterns
- **Inner code importing outer types**, including framework request objects or ORM row structs.
- **Business rules in the database** (stored procedures and the like) or in the UI.
- **Rigorous CA layering in the front end**: there are no business rules there to protect.

## Key Takeaways
1. The Dependency Rule is the one non-negotiable constraint.
2. Entities hold domain rules, use cases hold application rules, adapters translate, drivers are glue, and main wires everything.
3. Test every layer in isolation.
4. Layers can be repeated inside each bounded context or microservice.
5. Main is a layer, not just a file: it includes factories, routes and environment loading.

## Connects To
- **Ch 6–10**: one chapter per layer, implemented.
- **Ch 2**: the abstraction levels that the circles encode.
