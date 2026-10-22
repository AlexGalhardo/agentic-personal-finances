# Chapter 10: Main & Configuration (Principal & Configuração)

## Core Idea
The composition layer, the "dirty" main, knows every concrete class. It reads the environment, builds every object through factories, wires the framework (Express) to the technology-free controllers, and starts the server.

## Frameworks Introduced
- **Framework adapters live here**: `adaptRoute(controller)` translates an Express `Request`/`Response` to and from `HttpRequest`/`HttpResponse`. `adaptMiddleware(middleware)` pulls the `x-access-token` header and the `ownerId` from the request body into the middleware request.
- **Factories for the infrastructure**: `makeUserRepository`, `makeNoteRepository`, `makeEncoder` (bcrypt rounds from the environment) and `makeTokenManager` (JWT secret from the environment). Each lives in its own file. Swapping a technology happens in one place.
- **Factories for controllers and middleware**: for example `makeSignUpController()` builds `new WebController(new SignUpOperation(new SignUp(makeUserRepository(), makeEncoder(), new CustomAuthentication(makeUserRepository(), makeEncoder(), makeTokenManager()))))`. All the dependency injection happens here.
- **Middleware setup**: JSON body parsing, CORS (the example allows any origin, header and method) and a JSON content type, each in its own file and applied by `setupMiddleware(app)`.
- **Routes (REST)**: `POST /signup`, `POST /signin`, `POST /notes`, `GET /notes`, `PUT /notes/:noteId`, `DELETE /notes/:noteId`. The note routes go through the authentication middleware.
- **Entry point** (`server.ts`): load the environment (dotenv), connect to Mongo, then have `app` listen on `PORT`.
- **Environment practices**: the variables are `MONGO_URL`, `PORT`, the JWT secret and the bcrypt rounds. Do **not** commit `.env`. Do not keep several `.env` files in one repo, because configuration varies by deployment. Prefer `dotenv-safe` with a committed `.env.example` that lists the required keys.

## Key Concepts
- **Composition root**: the single place where concretions meet abstractions.
- **Factory**: a function that hides construction and configuration.
- **Route adapter**: the framework-specific shim that is the only code touching Express types besides the setup code.

## Mental Models
- Main is a plug-in to the application, not the reverse. It depends on everything, and nothing depends on it.
- If you want to know which database the app uses, you should only need to read the factories.

## Anti-patterns
- **`new ConcreteThing()` scattered through the use cases or controllers.**
- **Committed secrets in `.env`.**
- **Per-environment config files checked into the same repository.**

## Key Takeaways
1. Keep all wiring in one outer layer.
2. Framework adapters (route and middleware) are thin translators to your own HTTP types.
3. Configuration comes from the environment and is injected through factories.
4. One factory per component makes a technology swap a one-file change.

## Connects To
- **Ch 8**: the controllers and middleware being wrapped.
- **Ch 9**: the adapters being instantiated.
- **Ch 3**: the Main layer, defined as the lowest-level policy.
