import cors from "cors";
import express from "express";
import healthRoutes from "./routes/health.routes";
import projectsRoutes from "./routes/projects.routes";
import tasksRoutes from "./routes/task.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware";
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/tasks", tasksRoutes);

app.use(errorMiddleware);
export default app;
