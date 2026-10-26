import cors from "cors";
import express from "express";
import healthRoutes from "./routes/health.routes.js";
import projectsRoutes from "./routes/projects.routes.js";
import tasksRoutes from "./routes/task.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";
import {
  requireAuth,
  requireMasterAdmin,
  requirePasswordChangeComplete,
} from "./middlewares/require-auth.middleware.js";
import notificationRouter from "./routes/notification.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import adminRoutes from "./routes/admin.routes.js";
const app = express();

const webOrigin = process.env.WEB_ORIGIN;
app.use(
  webOrigin
    ? cors({ origin: webOrigin ?? "http://localhost:3000", credentials: true })
    : cors(),
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/health", healthRoutes);
app.use("/api/projects", requireAuth, requirePasswordChangeComplete, projectsRoutes);
app.use("/api/tasks", requireAuth, requirePasswordChangeComplete, tasksRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRouter);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", requireAuth, requirePasswordChangeComplete, requireMasterAdmin, adminRoutes);
app.use(errorMiddleware);
export default app;
