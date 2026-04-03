import { AppOpenAPI } from "./types";
import packageJSON from "../../package.json";

function configureOpenAPI(app: AppOpenAPI) {
  app.doc31("/docs", {
    openapi: "3.1.0",
    info: { title: "Graduation API", version: packageJSON.version },
  });
}

export { configureOpenAPI };
