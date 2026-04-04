import { db } from "@/database";
import { createRouter } from "@/lib/create-app";
import { createRoute, z } from "@hono/zod-openapi";
import {
  insertUsersSchema,
  selectUsersSchema,
  updateUsersSchema,
  users,
} from "@/database/schema";
import { eq } from "drizzle-orm";

const usersRouter = createRouter();

usersRouter.openapi(
  createRoute({
    method: "get",
    path: "/",
    tags: ["users"],
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
    const users = await db.query.users.findMany();
    return c.json(users);
  },
);

usersRouter.openapi(
  createRoute({
    method: "post",
    path: "/register",
    tags: ["users"],
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
    const [inserted] = await db.insert(users).values(user).returning();
    return c.json(inserted);
  },
);

usersRouter.openapi(
  createRoute({
    method: "patch",
    path: "/update/:id",
    tags: ["users"],
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
      .update(users)
      .set(userPatch)
      .where(eq(users.id, id))
      .returning();
    return c.json(updatedUser);
  },
);

export { usersRouter };
