import { Router } from "express";
import { requireAuth, requirePasswordChangeComplete } from "../middlewares/require-auth.middleware";
import {
  getMyNotificationsController,
  getUnreadNotificationCountController,
  markAllNotificationsAsReadController,
  markNotificationAsReadController,
} from "../controllers/notification.controller";

const router = Router();

router.use(requireAuth, requirePasswordChangeComplete);

router.get("/unread-count", getUnreadNotificationCountController);

router.patch("/read-all", markAllNotificationsAsReadController);

router.patch("/:id/read", markNotificationAsReadController);

router.get("/", getMyNotificationsController);

export default router;
