import { env } from "./env";
import { serveStatic } from "hono/bun";
import { createApp } from "@/lib/create-app";
import { usersRouter } from "@/routes/users.route";
import { configureOpenAPI } from "@/lib/configure-open-api";

const app = createApp();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.use("/favicon.ico", serveStatic({ path: "./src/assets/favicon.ico" }));

configureOpenAPI(app);
app.route("/users", usersRouter);

export default {
  fetch: app.fetch,
  port: env.PORT,
};
