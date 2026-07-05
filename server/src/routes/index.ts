export { authRouter } from "./auth.js";
export { callsRouter } from "./calls.js";
export { ownersRouter } from "./owners.js";
export { projectsRouter } from "./projects.js";
export { sessionsRouter } from "./sessions.js";
export { usersRouter } from "./users.js";

import { Router } from "express";
import { authRouter } from "./auth.js";
import { callsRouter } from "./calls.js";
import { ownersRouter } from "./owners.js";
import { projectsRouter } from "./projects.js";
import { sessionsRouter } from "./sessions.js";
import { usersRouter } from "./users.js";

export const apiRouter = Router();
apiRouter.use("/", authRouter);
apiRouter.use("/projects", projectsRouter);
apiRouter.use("/owners", ownersRouter);
apiRouter.use("/calls", callsRouter);
apiRouter.use("/sessions", sessionsRouter);
apiRouter.use("/users", usersRouter);
apiRouter.get("/", (req, res) => {
  res.json({ message: "Welcome to the API!" });
});