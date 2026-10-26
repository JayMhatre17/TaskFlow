import cors from "cors";
import express from "express";
import healthRoutes from "./routes/health.routes";
import projectsRoutes from "./routes/projects.routes";
import tasksRoutes from "./routes/task.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware";
import authRoutes from "./routes/auth.routes";
import cookieParser from "cookie-parser";
import {
  requireAuth,
  requireMasterAdmin,
  requirePasswordChangeComplete,
} from "./middlewares/require-auth.middleware";
import notificationRouter from "./routes/notification.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import adminRoutes from "./routes/admin.routes";
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
