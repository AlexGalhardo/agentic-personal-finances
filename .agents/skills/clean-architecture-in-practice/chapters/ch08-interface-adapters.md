# Chapter 8: Interface Adapters (Adaptadores de Interface)

## Core Idea
This layer converts data to and from the use cases. It holds the **technology-independent** web controllers and the auth middleware. Adapters that call a concrete driver directly, such as the MongoDB driver or bcrypt, do **not** belong here, because they would make this layer depend on an outer one.

## Frameworks Introduced
- **The placement rule for adapters**: an adapter that talks directly to an external library is infrastructure and belongs in **Frameworks & Drivers**. Only intermediate, generic adapters (for example, a DB gateway that is not tied to a specific engine) live in Interface Adapters. This is the author's strict reading of the Dependency Rule.
- **Own HTTP abstractions**: `HttpRequest {body}` and `HttpResponse {statusCode, body}` interfaces, plus an `HttpHelper` with `ok`, `created`, `badRequest`, `forbidden` and `serverError`. Controllers never see Express types. Moving to GraphQL would only need a more abstract request type.
- **The controller is the canonical Hexagonal adapter**: an HTTP driver hits an adapter, the adapter makes a procedural call on a port, and the port is the use case.
- **Template Method by composition**: `WebController` implements the shared flow: (1) check that the required params are present, (2) return 400 with the names of the missing params, (3) run the specific operation inside try/catch, and (4) return 500 on an exception. It receives a `ControllerOperation {requiredParams: string[], specificOp(req)}` by injection. The author prefers composition over inheritance, as the GoF book also recommends.
- **Operation classes** map use-case results to status codes:
  - `SignUpOperation`: 201 on success, 403 if the user already exists, 400 for other errors.
  - `CreateNoteOperation`: 201 or 400.
  - `UpdateNoteOperation`: the ids are required params. Title and/or content are checked inside the operation (400 if both are missing). Returns 200 or 400.
- **Middleware interface**: `handle(request) -> HttpResponse`. The `Authentication` middleware checks that the token and the requester id are present (403 if not), verifies the token (403 if invalid or expired), and checks that the payload id equals the requester id (200 if so, 403 if not). It also wraps everything in try/catch (500) so that no entry point can fail without returning a response.

## Key Concepts
- **MVC in this layer**: in Martin's model, the controller, the presenter and the view all live in Interface Adapters. The "model" passed in is just a convenient data structure.
- **Authentication vs authorization**: authentication checks that the token is valid. Authorization checks that the resource belongs to the requester.
- **Generic errors** in the middleware are a noted debt. The suggested refactor is to add specific types such as `UserUnauthorizedError`.

## Mental Models
- A controller does three things: validate the presence of inputs, call one use case, and map the result to a transport status.
- Every external entry point (controller or middleware) has a top-level catch. Nothing inside the core does.
- If the same flow repeats across controllers, extract a template object and inject the variation.

## Anti-patterns
- **Placing direct driver adapters in the adapter layer.**
- **Framework request objects in controllers.**
- **Business logic in controllers.**
- **Copy-pasted parameter checks** in every controller.

## Key Takeaways
1. Define your own request and response types at the boundary.
2. Keep controllers thin: input check, call the use case, map the status.
3. Use composition to share controller logic.
4. Errors map to status codes in the adapter, never in the use case.
5. Use middleware for cross-cutting authentication, kept free of framework types.

## Connects To
- **Ch 7**: the `UseCase` ports these call.
- **Ch 10**: Express route and middleware adapters wrap these classes.
