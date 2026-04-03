import { AppOpenAPI } from "./types";
import packageJSON from "../../package.json";
import { Scalar } from "@scalar/hono-api-reference";

function configureOpenAPI(app: AppOpenAPI) {
  app.doc31("/doc", {
    openapi: "3.1.0",
    info: { title: "Graduation API", version: packageJSON.version },
  });
  app.get(
    "/reference",
    Scalar({
      spec: {
        url: "/doc",
      },
    }),
  );
}

export { configureOpenAPI };
