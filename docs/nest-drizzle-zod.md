# SIAM API — NestJS 12, Drizzle ORM, Zod

**Project layout (public/admin API, domain modules):** [architecture.md](./architecture.md).

Team reference aligned with [Nest Drizzle](https://docs.nestjs.com/data/drizzle), [Validation](https://docs.nestjs.com/application/validation), and [Migration guide](https://docs.nestjs.com/migration-guide).

## Stack baseline

| Piece | Choice |
|--------|--------|
| Nest | 12.x (`@nestjs/*` same major) |
| Drizzle | `drizzle-orm@rc` (**v1**) + `drizzle-kit@rc` — relations: [Drizzle Relations](https://orm.drizzle.team/docs/relations) |
| Postgres | `pg` + `drizzle-orm/node-postgres` |
| Nest DB integration | `@nestjs/drizzle` |
| HTTP + env validation | Zod 4 + Standard Schema (Nest 12) |
| Config | `@nestjs/config@12` + Zod `validationSchema` |
| OpenAPI | `@nestjs/swagger@12` + `zod-openapi` + `standardSchemaConverter` |

**Node:** runtime ≥ 20.19 or 22.12+. Prefer `pnpm exec nest` over a stale global CLI.

---

## NestJS 12 + Zod

### Rules

1. **New HTTP APIs:** Zod + Standard Schema — not `class-validator` / class DTOs unless legacy.
2. **Global pipe** in `main.ts`: `StandardSchemaValidationPipe`.
3. **Route schemas:** `@Body({ schema })`, `@Query({ schema })`, `@Param('id', { schema })`.
4. **Types:** `type Dto = z.infer<typeof schema>` — one source of truth (same file as the schema).
5. **API contracts:** under `public-api/<feature>/dto/` and `admin-api/<feature>/dto/` — **one `*.dto.ts` file per body, query, or params schema** (optional separate files for serialized responses). See [architecture.md](./architecture.md).
6. **Env:** `ConfigModule.forRoot({ validationSchema: envSchema })` — fail fast on boot.
7. **Feature code:** inject `AppConfigService` getters — not raw `ConfigService.get('PORT')`.
8. **Responses (when needed):** Zod + `StandardSchemaSerializerInterceptor` + `@SerializeOptions({ schema })`.

### Swagger

- `SwaggerModule.createDocument(app, config, { extraModels: [], converters: [standardSchemaConverter] })` (see `src/swagger/setup-swagger.ts`).
- Reuse validation Zod schemas; use `.meta({ title: '...' })` for named components via `zod-openapi` `createSchema()`.

---

## Drizzle — NestJS integration model

**No TypeORM entities, no `forFeature()`, no framework-generated repositories.**

### Packages

```bash
pnpm add @nestjs/drizzle drizzle-orm@rc pg
pnpm add -D drizzle-kit@rc @types/pg
```

### Schema (source of truth)

- Tables: `pgTable()` from `drizzle-orm/pg-core`.
- Types (co-locate in the same file as the table, or in a `types.ts` next to it):

```typescript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

#### Organizing tables (files and folders)

Drizzle Kit accepts **one file** or a **directory** (recursive scan). Official guide: [Organize your schema files](https://orm.drizzle.team/docs/sql-schema-declaration#organize-your-schema-files).

**Recommended for siam-api once you have more than a handful of tables:**

```
src/db/
  schema/
    index.ts              # barrel — re-exports only (tables, enums, pgSchema)
    columns/
      timestamps.ts       # shared column bundles (...timestamps)
    auth/
      users.ts
      sessions.ts
    catalog/
      products.ts
  relations.ts            # defineRelations(import * as schema from './schema')
  database.ts             # optional Database type
```

**`drizzle.config.ts`** — point at the folder (not only `schema.ts`):

```typescript
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema',
  out: './drizzle',
  // ...
});
```

Kit discovers every `.ts` file under `schema/`; **you do not need `index.ts` for migrations** as long as each file **exports** its `pgTable` / `pgEnum` models.

**Barrel (`schema/index.ts`)** — optional but useful for app code and relations:

```typescript
// schema/index.ts — re-export tables only; avoid exporting random helpers here
export * from './columns/timestamps'; // if you export column helpers, keep them out of kit path or non-table exports only in columns/
export * from './auth/users';
export * from './auth/sessions';
export * from './catalog/products';
```

```typescript
// relations.ts
import * as schema from './schema';

export const relations = defineRelations(schema, (r) => ({
  // ...
}));
```

Services import one path: `from '../db/schema'` or `from '@/db/schema'` (resolves to `index.ts`).

**Prefer domain files over one-file-per-table** when tables are tightly coupled (fewer import cycles):

```
schema/auth.ts     → users, sessions, refreshTokens
schema/catalog.ts  → products, categories
```

Use **one file per table** when domains are large and ownership is clear (`schema/billing/invoices.ts`).

**Avoid circular imports between schema files.** FKs should form a DAG where possible: child table imports parent (`posts.ts` imports `users` from `./users`). If two tables reference each other, use a lazy column reference on at least one side:

```typescript
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

invitee: integer('invited_by').references((): AnyPgColumn => users.id),
```

**Shared columns** — Drizzle’s pattern: define a plain object and spread into `pgTable` ([advanced](https://orm.drizzle.team/docs/sql-schema-declaration#advanced)):

```typescript
// schema/columns/timestamps.ts
export const timestamps = {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
};
```

Do **not** put `pgTable` definitions only in Nest feature modules — keep all models under `src/db/schema` so Kit and migrations stay authoritative.

**Relations file growth** — mirror domains with `defineRelationsPart` (see Relations section) or a `relations/` folder merged in `relations/index.ts`; pass the merged object to `DrizzleModule` as today.

**Single-file OK** — `src/db/schema.ts` remains fine for early/small schemas; migrate to `schema/` when edits get noisy.

**JSONB (SIAM):** Prefer normalized tables. Use `jsonb` (or `text[]`) only for **small bounded** data — e.g. a short list of strings — not for page bodies or nested content. See [project-decisions.md](../../docs/project-decisions.md).

**Foreign keys (DB integrity)** — use `.references()` on the column that stores the FK. This is separate from Drizzle “soft” relations below:

```typescript
export const photos = pgTable('photos', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
});
```

### Register database (once, global)

Use **`DrizzleModule.forRootAsync`** in `AppModule`:

- `drizzle` — function from `drizzle-orm/node-postgres` (not a shared singleton `db` file unless you understand lifecycle).
- `connection` — URL from `AppConfigService.databaseUrl`.
- With relational API: pass `relations` from `defineRelations()` (same as Drizzle `drizzle()` options).
- One pool per Nest app; default `autoCloseConnection: true` on shutdown.

**Avoid:** `forRoot({ db: sharedDb })` created at import time — breaks e2e when multiple apps share one pool (see Nest docs).

### Inject Drizzle in a service

`DrizzleModule` is registered once in `AppModule`. Feature modules **do not** import `DrizzleModule` again. Any `@Injectable()` can request the database with `@InjectDrizzle()`.

**1. Register providers in a feature module** (controller + service only; no Drizzle import):

```typescript
// users/users.module.ts
@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // if other modules need it
})
export class UsersModule {}
```

**2. Inject in the service** with the driver type from `drizzle-orm/node-postgres`:

```typescript
// users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { users, type NewUser, type User } from '../db/schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectDrizzle()
    private readonly db: NodePgDatabase,
  ) {}

  findAll(): Promise<User[]> {
    return this.db.select().from(users);
  }

  async findOne(id: number): Promise<User | undefined> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return row;
  }

  async create(dto: NewUser): Promise<User> {
    const [created] = await this.db.insert(users).values(dto).returning();
    return created;
  }
}
```

**3. Raw SQL** (same injection pattern — see `src/health/health.service.ts`):

```typescript
import { sql } from 'drizzle-orm';

await this.db.execute(sql`SELECT 1`);
```

**4. Typed database when using relations** — after `relations` is passed in `DrizzleModule.forRootAsync`, use a shared alias:

```typescript
// src/db/database.ts
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { relations } from './relations';

export type Database = NodePgDatabase<typeof relations>;

// users.service.ts
constructor(@InjectDrizzle() private readonly db: Database) {}

findWithPhotos(id: number) {
  return this.db.query.users.findFirst({
    where: { id },
    with: { photos: true },
  });
}
```

**5. Named database** (second connection):

```typescript
constructor(@InjectDrizzle('analytics') private readonly analyticsDb: NodePgDatabase) {}
```

**6. Optional repository** — same injection, queries grouped for tests:

```typescript
@Injectable()
export class UsersRepository {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  findActive() {
    return this.db.select().from(users).where(eq(users.isActive, true));
  }
}

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}
}
```

**7. Factory provider** (rare — prefer constructor injection):

```typescript
import { getDrizzleToken } from '@nestjs/drizzle';

{
  provide: SomeService,
  useFactory: (db: NodePgDatabase) => new SomeService(db),
  inject: [getDrizzleToken()], // getDrizzleToken('analytics') for named DB
}
```

Rules:

- Import **table objects** from `src/db/schema.ts`; no `DrizzleModule.forFeature()`.
- Do not create a separate Nest provider for `db` unless you have a special case — `@InjectDrizzle()` is the supported API.

### Queries (CRUD)

Use the **SQL-like query builder** (`select` / `insert` / `update` / `delete`). Filters go in `.where(...)` using operators from `drizzle-orm` (see next section).

```typescript
import { eq } from 'drizzle-orm';

await this.db.select().from(users).where(eq(users.id, id));
await this.db.insert(users).values(row).returning();
await this.db.update(users).set({ isActive: false }).where(eq(users.id, id));
await this.db.delete(users).where(eq(users.id, id));
```

Queries run when awaited; result types follow the selected columns. For nested reads without hand-written joins, use **relational queries** (`db.query`) after relations are configured.

### WHERE clauses

SIAM uses **Drizzle ORM v1** (`drizzle-orm@rc`). There are **two** filter styles — do not mix them in one call.

#### 1. Query builder — `.where()` with operators

Import operators from `drizzle-orm`. Pass **column references** from your table objects (`users.id`, not bare strings). Values are parameterized automatically.

```typescript
import { and, eq, gt, ilike, inArray, isNotNull, ne, or, sql } from 'drizzle-orm';

// single condition
await this.db.select().from(users).where(eq(users.id, id));

// AND / OR
await this.db
  .select()
  .from(users)
  .where(and(eq(users.isActive, true), gt(users.id, 10)));

await this.db
  .select()
  .from(users)
  .where(or(eq(users.role, 'admin'), eq(users.role, 'moderator')));

// comparisons, null, lists, pattern match (Postgres ilike)
await this.db.select().from(users).where(ne(users.email, email));
await this.db.select().from(users).where(isNotNull(users.email));
await this.db.select().from(users).where(inArray(users.id, ids));
await this.db.select().from(users).where(ilike(users.name, `%${term}%`));

// dynamic fragments (still prefer eq/and when possible)
await this.db.select().from(users).where(sql`${users.id} = ${id}`);
```

Use this style in **services, repositories, and transactions** (`tx.select()...where(eq(...))`) for most CRUD and reporting.

**Joins:** filter with `eq` on both sides in `.innerJoin` / `.leftJoin`, or use relational `db.query` when you need nested objects.

#### 2. Relational queries — `where: { ... }` object API

Only on **`db.query.<table>.findMany` / `findFirst`** after `relations` is passed to `DrizzleModule`. Uses a **nested object**, not `eq()` at the top level (unless you use `RAW`).

```typescript
// equality shorthand — multiple keys are ANDed
await this.db.query.users.findMany({
  where: { id: 1 },
});

await this.db.query.users.findMany({
  where: { age: 15, name: 'John' },
});

// operators on a column
await this.db.query.users.findMany({
  where: {
    OR: [{ id: { gt: 10 } }, { name: { like: 'John%' } }],
  },
});

await this.db.query.posts.findMany({
  where: { id: 1 },
  with: {
    comments: {
      where: { createdAt: { lt: new Date() } },
    },
  },
});

// AND / OR / NOT
await this.db.query.users.findMany({
  where: {
    NOT: { id: { gt: 10 } },
    AND: [{ isActive: true }],
  },
});
```

Column operators in relational `where` include: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `in`, `notIn`, `like`, `ilike`, `notLike`, `notIlike`, `isNull`, `isNotNull`, plus `OR`, `AND`, `NOT`, and **`RAW`**.

**`RAW` and `orderBy` in relational queries:** use the **callback** form with the aliased table `t` — do not reference imported table columns directly in `sql` templates (Drizzle v1 requirement):

```typescript
await this.db.query.users.findMany({
  where: {
    RAW: (t) => sql`LOWER(${t.name}) LIKE ${pattern}`,
  },
  orderBy: (t, { desc }) => desc(t.createdAt),
});
```

| Use case | API |
|----------|-----|
| Update/delete by id, simple lists | Query builder + `eq` / `and` |
| Nested `with: { comments: true }` + filters on parent/child | `db.query` + object `where` |
| Complex SQL in one table | Query builder + `sql` or relational `RAW: (t) => ...` |

### Relations (Drizzle v1 — `drizzle-orm@rc`)

**Official doc:** [orm.drizzle.team/docs/relations](https://orm.drizzle.team/docs/relations) — this is the **current** relations guide (install `drizzle-orm@rc`, `defineRelations`, `r.one` / `r.many`). Drizzle also labels this “Relational Queries v2” in the [v1 → v2 migration guide](https://orm.drizzle.team/docs/relations-v1-v2); it is **not** a separate product from the `/docs/relations` page.

**Version rule:** siam-api pins **`drizzle-orm@rc`**. Follow **`defineRelations`** on that page.

| Era | Pattern | siam-api |
|-----|---------|----------|
| Legacy (pre–`defineRelations`) | Per-table `relations(users, ({ one, many }) => …)` and pass relation objects into `drizzle({ schema })` | **Do not use** |
| Current (`@rc`) | Single `defineRelations(schema, (r) => …)` + `drizzle(..., { relations })` | **Use this** |

Nest [Drizzle](https://docs.nestjs.com/data/drizzle) matches the current guide (`defineRelations` + `relations` on `DrizzleModule`).

Relations are **only for the relational query API** (`db.query.*`). They do **not** replace `.references()` on columns for FK constraints in Postgres (the doc’s [Foreign keys](https://orm.drizzle.team/docs/relations#foreign-keys) section — keep DB FKs in `pgTable`; index FK columns for join performance).

#### File layout

```
src/db/
  schema/        # or schema.ts while small
  relations.ts
  database.ts    # optional
```

#### Define relations

Pass **all tables** (as a map or `import * as schema`) into `defineRelations`. Keys under each table name are **custom relation names** used in `with: { ... }`.

```typescript
// src/db/relations.ts
import { defineRelations } from 'drizzle-orm';
import * as schema from './schema';

export const relations = defineRelations(schema, (r) => ({
  users: {
    photos: r.many.photos(),
  },
  photos: {
    user: r.one.users({
      from: r.photos.userId,
      to: r.users.id,
    }),
  },
}));
```

**`r.one.<table>({ from, to })`** — single related row (many-to-one / one-to-one).  
**`from`** — column on the **source** table; **`to`** — column on the **target** table.

**`r.many.<table>()`** — array of related rows when Drizzle can infer the link from the other side’s `one` definition. If not inferrable, pass explicit `from` / `to` like `one`.

**One-to-many (posts + author)** — define both sides:

```typescript
export const relations = defineRelations({ users, posts }, (r) => ({
  posts: {
    author: r.one.users({
      from: r.posts.authorId,
      to: r.users.id,
    }),
  },
  users: {
    posts: r.many.posts(),
  },
}));
```

**Many-to-many** — model a junction table in `schema.ts`, then use `.through()`:

```typescript
users: {
  groups: r.many.groups({
    from: r.users.id.through(r.usersToGroups.userId),
    to: r.groups.id.through(r.usersToGroups.groupId),
  }),
},
```

Optional on `one` / `many` (see doc sections **one()** / **many()**):

- `optional: false` — related object required at the type level.
- `alias` — disambiguate multiple links between the same two tables.
- **`where` on the relation** — [predefined filters](https://orm.drizzle.team/docs/relations#predefined-filters): always applied when loading that relation via `with`; filters only **target (`to`) table** columns. Not the same as `findMany({ where: … })` at query time.

**Split large relation graphs** — [Relations Parts](https://orm.drizzle.team/docs/relations#relations-parts): `defineRelationsPart(schema, …)` merged when creating the db:

```typescript
// Nest: spread into the relations option (main block first)
relations: { ...relations, ...postsPart },
```

Main `defineRelations` must come **first** in the spread so table names stay in sync for inference; see the doc for the empty `defineRelationsPart(schema)` bootstrap pattern.

#### Wire relations in Nest

Pass `relations` into `DrizzleModule.forRootAsync` (same options Drizzle passes to `drizzle()`):

```typescript
import { relations } from './db/relations';

DrizzleModule.forRootAsync({
  imports: [AppConfigModule],
  inject: [AppConfigService],
  useFactory: (appConfig: AppConfigService) => ({
    drizzle,
    connection: appConfig.databaseUrl,
    relations,
  }),
}),
```

#### Query with relations

```typescript
await this.db.query.users.findFirst({
  where: { id },
  with: { photos: true },
});

await this.db.query.users.findMany({
  with: {
    posts: {
      with: { comments: true },
      where: { published: true },
    },
  },
});
```

Type the injected db as `Database` (`NodePgDatabase<typeof relations>`) so `db.query` is fully typed.

### Transactions

Use the **injected** `db` to start a transaction. The callback receives `tx` with the same query API as `db`. Everything that must commit or roll back together runs on **`tx` only**.

**Basic — multiple statements, auto-commit:**

```typescript
async deactivateUser(id: number): Promise<void> {
  await this.db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ isActive: false })
      .where(eq(users.id, id));
    await tx.delete(photos).where(eq(photos.userId, id));
  });
}
```

**Return a value from the transaction** — `transaction()` resolves to whatever the callback returns:

```typescript
async createUserWithProfile(dto: NewUser, bio: string): Promise<User> {
  return this.db.transaction(async (tx) => {
    const [user] = await tx.insert(users).values(dto).returning();
    await tx.insert(profiles).values({ userId: user.id, bio });
    return user;
  });
}
```

**Rollback** — throw inside the callback (or call `tx.rollback()`). The transaction is aborted and the error propagates:

```typescript
await this.db.transaction(async (tx) => {
  const [user] = await tx.insert(users).values(dto).returning();
  if (!user) {
    throw new Error('insert failed'); // entire transaction rolls back
  }
});
```

**Repository + transaction** — methods that must run inside a transaction accept `tx` explicitly; default overload uses `this.db`:

```typescript
type DbOrTx = Database; // same API on db and tx in Drizzle

@Injectable()
export class UsersRepository {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  async deactivate(id: number, conn: DbOrTx = this.db): Promise<void> {
    await conn.update(users).set({ isActive: false }).where(eq(users.id, id));
  }
}

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async deactivateInTransaction(id: number): Promise<void> {
    await this.db.transaction(async (tx) => {
      await this.usersRepo.deactivate(id, tx); // must pass tx
    });
  }
}
```

**Wrong** — using `this.db` inside the callback runs **outside** the transaction (often a different pool connection):

```typescript
// ❌ photos delete is NOT in the same transaction as the user update
await this.db.transaction(async (tx) => {
  await tx.update(users).set({ isActive: false }).where(eq(users.id, id));
  await this.db.delete(photos).where(eq(photos.userId, id));
});
```

**Cross-service transactions** — pass `tx` through service method parameters, or use [`nestjs-cls`](https://github.com/Papooch/nestjs-cls) with a Drizzle transactional plugin so nested calls see the same `tx` without threading it through every layer.

**Nest note:** Repository helpers that only use `this.db` are fine for single-statement work; for multi-step atomic flows, orchestrate with `db.transaction()` in the service (or accept `tx` in repository methods as above).

### Custom repositories (optional)

- `@Injectable()` class injects `@InjectDrizzle()`, encapsulates queries for one domain.
- Services depend on repository; unit tests mock repository or `getDrizzleToken()`.
- Repository methods use `this.db` by default — they join an existing transaction only when called with `tx` passed in.

### Migrations (Drizzle Kit — outside Nest DI)

- `drizzle.config.ts`: `schema`, `out: './drizzle'`, `dbCredentials.url` (load `.env` in config for CLI).
- Workflow: edit schema → `pnpm db:generate` → commit SQL → `pnpm db:migrate` (or `pnpm db:migrate:docker`).
- **Production / multiple replicas:** run migrate as a **release step**, not on every instance boot.
- Optional boot migrate only for single-instance dev (Nest docs `migrate()` in `forRootAsync` factory).

### Testing

Override the same token `@InjectDrizzle()` uses — `getDrizzleToken()` (or `getDrizzleToken('analytics')`):

```typescript
// health.service.spec.ts pattern
const execute = vi.fn();
const module = await Test.createTestingModule({
  providers: [
    HealthService,
    { provide: getDrizzleToken(), useValue: { execute } },
  ],
}).compile();
```

For `transaction()` tests, mock `transaction` to invoke the callback with a shared mock `tx`:

```typescript
const tx = { insert: vi.fn(), update: vi.fn() /* ... */ };
const db = {
  transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
};
{ provide: getDrizzleToken(), useValue: db }
```

- Prefer mocking **repositories** when query chains are complex.
- Real Postgres in CI only when intentionally testing integration.

### Multiple databases

- Second `DrizzleModule.forRoot*` with `name: 'analytics'`.
- `@InjectDrizzle('analytics')` / `getDrizzleToken('analytics')`.
- Only one unnamed (default) database.

---

## HTTP validation vs database shape

| Layer | Tool |
|--------|------|
| API input/output | Zod + Standard Schema |
| Tables / columns | Drizzle `pgTable` |
| Optional bridge | `drizzle-orm/zod` from tables — not a substitute for HTTP `dto/` files |

Keep request schemas and table definitions separate unless you deliberately derive one from the other.

---

## SIAM repo conventions

- **Env:** single `.env`; `src/config/env.schema.ts` + `AppConfigService`.
- **Docker:** `compose.yaml` — app uses `postgres:5432`; host tools use `DATABASE_URL` with `DB_EXTERNAL_PORT`.
- **Scripts:** `docker:dev`, `db:generate`, `db:migrate`, `db:migrate:docker`, `db:studio`, `db:studio:docker`.
- **Features:** Nest modules (`HealthModule`, …); Drizzle stays global.

---

## Do / don’t

| Do | Don’t |
|----|--------|
| `forRootAsync` + `AppConfigService` | `forRoot` with `process.env` at module import without env loaded |
| `@InjectDrizzle()` in services/repos | TypeORM entities + `@InjectRepository` |
| `drizzle-kit generate` + commit migrations | Change DB by hand without migrations |
| Zod `@Body({ schema })` + `z.infer` | Duplicate class DTOs for every endpoint |
| Mock `getDrizzleToken()` in tests | Require Docker Postgres for every test |
| Use `tx` inside `transaction()` | Mix `this.db` and `tx` in one transaction |
| `defineRelations` + `relations` in module (`@rc`) | Legacy per-table `relations(table, …)` schema style |
| Query builder `where(eq(col, val))` for CRUD | `eq()` inside `db.query` `where` object (use object operators instead) |
| Relational `RAW: (t) => sql\`...\`` | Import table columns in relational `RAW` / `orderBy` sql templates |

---

## References

- [Nest — Drizzle](https://docs.nestjs.com/data/drizzle)
- [Drizzle — Relations](https://orm.drizzle.team/docs/relations) (canonical; matches `@rc`)
- [Drizzle — Migrating relational queries to v2](https://orm.drizzle.team/docs/relations-v1-v2)
- [Drizzle — Relational queries](https://orm.drizzle.team/docs/rqb-v2)
- [Drizzle — Filter operators](https://orm.drizzle.team/docs/operators)
- [Nest — Validation](https://docs.nestjs.com/application/validation)
- [Nest — Migration guide](https://docs.nestjs.com/migration-guide)
- [Drizzle ORM](https://orm.drizzle.team/) (match v1/rc with Nest’s current chapter)
