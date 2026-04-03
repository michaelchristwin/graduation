import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { env } from "./env";
import { createApp } from "@/lib/create-app";
import { configureOpenAPI } from "@/lib/configure-open-api";
import { usersRouter } from "@/routes/users.route";

const querySchema = z.object({
  name: z.string().min(1),
});

const app = createApp();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/echo", zValidator("query", querySchema), (c) => {
  const { name } = c.req.valid("query");
  return c.json({ message: `Hello ${name}` });
});

configureOpenAPI(app);
app.route("/users", usersRouter);
export default {
  fetch: app.fetch,
  port: env.PORT,
};
