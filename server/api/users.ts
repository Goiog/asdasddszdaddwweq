// server/api/users.ts
import { insertUserSchema } from "@shared/schema"; // safe, pure zod
import { users } from "../db/schema"; // drizzle table (server-only)
import { db } from "../db/client"; // drizzle DB instance

app.post("/api/users", async (req, res) => {
  const parsed = insertUserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });
  const user = parsed.data;
  // Insert using drizzle (server-only)
  await db.insert(users).values(user);
  res.status(201).send(...);
});
