import { db } from "@/database";
import { createRouter } from "@/lib/create-app";
import { createRoute, z } from "@hono/zod-openapi";
import {
  insertUsersSchema,
  selectUsersSchema,
  updateUsersSchema,
  users as usersTable,
} from "@/database/schema";
import { eq, and, ilike } from "drizzle-orm";

const usersRouter = createRouter();

const getUsersQuerySchema = z.object({
  account_status: z.enum(["active", "suspended", "closed"]).optional(),
  address: z.string().optional(),
});

usersRouter.openapi(
  createRoute({
    method: "get",
    path: "/",
    tags: ["Users"],
    request: {
      query: getUsersQuerySchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: z.array(selectUsersSchema),
          },
        },
        description: "Get all users",
      },
    },
  }),
  async (c) => {
    const { account_status, address } = c.req.valid("query");

    const filters = [];

    if (account_status) {
      filters.push(eq(usersTable.account_status, account_status));
    }

    if (address) {
      filters.push(ilike(usersTable.address, `%${address}%`));
    }
    const users = await db.query.users.findMany({
      where: filters.length ? and(...filters) : undefined,
    });
    return c.json(users);
  },
);

usersRouter.openapi(
  createRoute({
    method: "post",
    path: "/register",
    tags: ["Users"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: insertUsersSchema,
          },
        },
        required: true,
        description: "The user to register",
      },
    },
    responses: {
      201: {
        content: {
          "application/json": {
            schema: selectUsersSchema,
          },
        },
        description: "Register a new smart grid user",
      },
    },
  }),
  async (c) => {
    const user = c.req.valid("json");
    const [inserted] = await db.insert(usersTable).values(user).returning();
    return c.json(inserted);
  },
);

usersRouter.openapi(
  createRoute({
    method: "patch",
    path: "/update/:id",
    tags: ["Users"],
    request: {
      params: z.object({
        id: z.uuid(),
      }),
      body: {
        content: {
          "application/json": {
            schema: updateUsersSchema,
          },
        },
        required: true,
        description: "New user field(s)",
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: selectUsersSchema,
          },
        },
        description: "Returns updated user object",
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const userPatch = c.req.valid("json");
    const [updatedUser] = await db
      .update(usersTable)
      .set(userPatch)
      .where(eq(usersTable.id, id))
      .returning();
    return c.json(updatedUser);
  },
);

export { usersRouter };
