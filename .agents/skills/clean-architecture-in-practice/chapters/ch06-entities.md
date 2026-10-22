# Chapter 6: Entities (Entidades)

## Core Idea
The Entities layer holds the purest domain data and rules, with no technology at all. The model is rich, not anemic: self-validating Value Objects and factory methods make an invalid entity impossible to construct.

## Frameworks Introduced
- **Self-validating Value Objects**: `Email`, `Password` and `Title` wrap primitives and avoid the *primitive obsession* smell.
  - A private constructor plus a static `create(raw)` factory that validates and returns `Either<InvalidXError, X>`.
  - Instances are frozen (immutable). The style is functional where possible (`map`, `find`, `some`).
  - Equality is by value, not identity.
  - Rules in the book: Email follows RFC 5322/5321 (lengths of the local part and each domain part, and conformance), and the validator was later extracted to an `email-validator` module. Password needs at least 6 characters and at least one digit. Title is 3 to 255 characters.
- **Entity factory composes the VO factories**: `User.create(email, password)` tries each VO and returns the first `Left` or `Right(User)`. `Note.create(owner, title, content)` works the same way.
- **"Make illegal states unrepresentable"** (Yaron Minsky, via Scott Wlaschin) is the justification for validating inside the domain.
- **No artificial ids in entities**: ids are a persistence and automation concern, so they first appear in the Use Case layer (DTOs and repositories).
- **Where to validate**: Martin accepts syntactic validation in outer layers ("data arrives clean"). The author validates in the entities anyway, because it makes the model self-contained and reusable and removes an implicit dependency on the outer layers. Validate in the back end even if the front end already did.

## Key Concepts
- **Value Object**: a small immutable object, equal by value.
- **Factory method**: the only way to build an instance. It validates first.
- **Anemic model**: data with no behaviour. Avoid it.
- **Critical business rule here**: a note has exactly one owner.
- **Password in the domain?**: arguably an application concern (authentication). It is kept in the domain because it is simple and has a real-world analogue, the padlocked diary.

## Mental Models
- Think of the entity layer as what you would find in classic OO analysis books (Fowler's *Analysis Patterns*, Booch): domain only.
- If the entity package imports anything besides the language and `shared`, it is no longer an entity layer.

## Anti-patterns
- **Primitive obsession**: `email: string` everywhere.
- **Public constructors that bypass validation.**
- **Ids or persistence annotations on entities.**

## Worked Example
Creating a user: `User.create("a@b.com", "abc123")` calls `Email.create`, which returns `Right(Email)`, then `Password.create`, which returns `Right(Password)`, and finally returns `Right(User)`. With the email "bad" it returns `Left(InvalidEmailError)` immediately. The caller branches on `isLeft()`. No exception is thrown.

## Key Takeaways
1. Entities depend on nothing outward.
2. Validate at construction. Invalid entities cannot exist.
3. Use Value Objects for every constrained property.
4. Return errors as values from factories.
5. Keep ids and storage concerns out of the domain.

## Connects To
- **Ch 4**: the Either type.
- **Ch 7**: use cases perform "the dance of the entities" using these factories.
