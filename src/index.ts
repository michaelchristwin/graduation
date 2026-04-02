import { z } from "zod";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { zValidator } from "@hono/zod-validator";
import { env } from "./env";

const querySchema = z.object({
  name: z.string().min(1),
});

const app = new Hono();

app.use(logger());

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/echo", zValidator("query", querySchema), (c) => {
  const { name } = c.req.valid("query");
  return c.json({ message: `Hello ${name}` });
});

export default {
  fetch: app.fetch,
  port: env.PORT,
};
