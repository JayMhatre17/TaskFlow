import { Router } from "express";
import { requireAuth, requirePasswordChangeComplete } from "../middlewares/require-auth.middleware.js";
import {
  getMyNotificationsController,
  getUnreadNotificationCountController,
  markAllNotificationsAsReadController,
  markNotificationAsReadController,
} from "../controllers/notification.controller.js";

const router = Router();

router.use(requireAuth, requirePasswordChangeComplete);

router.get("/unread-count", getUnreadNotificationCountController);

router.patch("/read-all", markAllNotificationsAsReadController);

router.patch("/:id/read", markNotificationAsReadController);

router.get("/", getMyNotificationsController);

export default router;
