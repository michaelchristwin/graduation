import { z } from "zod";
import { config } from "dotenv";

config();

const EnvSchema = z.object({
  NODE_ENV: z.string().default("development"),
  DATABASE_URL: z.url(),
  DATABASE_AUTH_TOKEN: z.string().optional(),
  PORT: z.coerce.number().default(3000),
});

const env = EnvSchema.parse(process.env);

export { env };
