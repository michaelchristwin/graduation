import { db } from "@/database";
import { insertUsersSchema, selectUsersSchema, users } from "@/database/schema";
import { createRouter } from "@/lib/create-app";
import { createRoute } from "@hono/zod-openapi";

const usersRouter = createRouter();

usersRouter.openapi(
  createRoute({
    method: "post",
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
    path: "/register",
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

export { usersRouter };
