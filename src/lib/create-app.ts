import { OpenAPIHono } from "@hono/zod-openapi";
import { logger } from "hono/logger";

function createRouter() {
  const app = new OpenAPIHono({ strict: false });
  return app;
}

function createApp() {
  const app = createRouter();
  app.use(logger());
  return app;
}
export { createApp, createRouter };
