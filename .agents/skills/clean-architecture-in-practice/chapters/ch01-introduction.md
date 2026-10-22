# Chapter 1: Introduction (Introdução)

## Core Idea
Clean Architecture (CA) is Robert Martin's synthesis of older layered architectures (Hexagonal, DCI, BCE); the book teaches it by building one small real system end to end. The chapter's "Warning to readers" (*Aviso aos Navegantes*) says what CA is **not**, which keeps it from being applied dogmatically.

## Frameworks Introduced
- **What Clean Architecture is not** (three warnings):
  1. **Not a silver bullet.** Martin calls it an *actionable idea*: adapt it to context. For very small systems (the author's threshold: under ~5,000 lines) it may hurt more than help.
  2. **Does not eliminate maintenance pain.** It *reduces* the cost of change, for example a database swap, but does not make change free.
  3. **Is not "fill the system with interfaces."** Calling that cargo cult and *overengineering*, the author says to weigh the flexibility an interface buys against the extra level of indirection. Interfaces belong mainly **where a call crosses an architectural boundary** (from one layer to another). **Inside a single layer, indirection is unnecessary.**
- **Common essence of the source architectures**: separation of concerns achieved by dividing software into layers.

## Key Concepts
- **Clean Architecture**: Martin's (2017) integration of decades of architecture ideas into one practical rule set.
- **Hexagonal / Ports & Adapters** (Cockburn 2005), **DCI** (Coplien & Reenskaug), **BCE** (Jacobson): the ancestors, covered in Ch 3.
- **Learning by example**: modelled on Beck's *TDD by Example*. Concepts are shown through a TypeScript REST back end.

## Mental Models
- Treat CA as a set of principles to tailor, not a template to stamp out.
- Ask "does this interface cross a layer boundary?" before you add one.

## Anti-patterns
- **Interface cargo cult**: never calling anything directly, so every call is indirect. The code gets harder to read with no gain in flexibility.
- **Applying CA to tiny systems**: the extra structure costs more than it saves.
- **Expecting zero-cost migrations**: decoupling lowers the cost of change but does not remove it.

## Key Takeaways
1. CA is a set of guiding principles. Adapt them.
2. Use interfaces at layer boundaries and use direct calls inside a layer.
3. Size matters. Small programs may not need the full layering.
4. The book is one author's interpretation, refined over about two years of practice. It is not the only valid reading.

## Connects To
- **Ch 3**: details the ancestor architectures and the layers.
- **Ch 7**: where the author knowingly bends ISP and uses one generic `UseCase` interface for simplicity.
