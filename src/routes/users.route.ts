import { createRouter } from "@/lib/create-app";
import { createRoute, z } from "@hono/zod-openapi";

const usersRouter = createRouter();

usersRouter.openapi(
  createRoute({
    method: "get",
    path: "/register",
    responses: {
      200: {
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
            }),
          },
        },
        description: "Register a new grid user",
      },
    },
  }),
  (c) => {
    return c.json({ message: "New user created" }, 200);
  },
);

export { usersRouter };
