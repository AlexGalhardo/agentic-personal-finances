# Chapter 2: Software Architecture (Arquitetura de Software)

## Core Idea
Architecture is the **shape** that builders give a system: how it is divided into components, how those components are arranged, and how they communicate. Its goal is to keep the system soft, meaning cheap to change, so that you minimize the human resources needed to build and maintain it.

## Frameworks Introduced
- **Four definitions of architecture**:
  - *Shared understanding* (Ralph Johnson via Fowler): the components and interfaces that all senior developers understand.
  - *Contemporary* (Richards & Ford): structure (style) + characteristics (the "-ilities") + architecture decisions + design principles.
  - *Academic* (Taylor et al.): the set of principal design decisions that govern a system.
  - *Essential* (Martin, the definition the book adopts): architecture = design. It is the shape of the system: its components, their arrangement and their communication.
- **Structure vs infrastructure**: structure is the design of components and modules. Infrastructure is the technologies and services that support that design. This book is about structure.
- **Goal of architecture** (Martin): to make it easy to develop, deploy, operate and maintain the system, and to **keep as many options open as possible, for as long as possible**.
- **Purpose and goal of software development** (Dan North): the purpose is positive business impact. The goal is to **minimize lead time to that impact, sustainably**. The best architecture is a *pluggable* one.
- **Levels of abstraction in code**: low-level technical details (for example, checking for a string terminator), **application business rules** (use cases), and **domain business rules** (for example, the prerequisites for a course enrollment).
- **Screaming Architecture**: the top-level structure should announce the system's purpose, meaning its use cases, not its framework.
- **Entity = critical business data + critical business rules.** Martin's Loan example has data (principal, rate, period) and rules (make payment, apply interest, charge late fee). The data and rules would exist even if nothing automated them.

## Key Concepts
- **Component**: a set of modules. **Module**: an aggregate of functions and data. In OO that is a class; otherwise it is a source file.
- **Domain business rules**: policies that make or save the business money, independent of automation.
- **Application business rules**: rules about *how the system automates* the domain, such as "show the loan estimate screen only after the customer is verified and the credit score is above the limit". These are the use cases.
- **Conway's Law / Inverse Conway Maneuver**: a system mirrors the organization that builds it, so you can shape the teams to get the architecture you want.
- **Information hiding** (Parnas 1972): expose abstract interfaces and hide volatile details so that teams can work independently.
- **Vitruvius triad**: utilitas, firmitas, venustas (utility, solidity, beauty). Beauty means encapsulating what is volatile.
- **Pluggable components**: the core sits at the centre and details plug into it as replaceable plug-ins.

## Mental Models
- "A poor implementation of a good abstraction does little harm; a bad abstraction or a missing layer rots everything" (Chris Kiehl, quoted).
- Bad architecture is worse than bugs. You can find bugs in a well-structured codebase, but you cannot safely change a mess.
- Decouple the database code so that the code and the business rules can **evolve independently**, not because the database will be swapped.
- Dependency Inversion (the D in SOLID) is the tool: high-level policy must not depend on low-level concretions, so both depend on an interface.

## Anti-patterns
- **Technology-first structure** (for example, folders named after Django or Express): it hides the purpose of the system.
- **Business rules leaking into infrastructure** or the reverse, so that a framework upgrade forces changes to the rules.

## Key Takeaways
1. Treat architecture as design viewed when zoomed out: the components and how they communicate.
2. Keep three abstraction levels apart: domain rules, application rules (use cases) and technical details.
3. Use cases deserve a privileged, visible place in the code layout.
4. Optimize for sustainable lead time, not raw speed.
5. A missing layer also hurts non-functional work, because you cannot tell where to optimize.

## Connects To
- **Ch 3**: the layers that put these abstraction levels into practice.
- **Ch 6 / Ch 7**: domain rules become Entities and application rules become Use Cases.
- **DDD** (Evans): the shared emphasis on the domain core.
