import { Router } from "express";
import { requireAuth } from "../middlewares/require-auth.middleware";
import {
  getMyNotificationsController,
  getUnreadNotificationCountController,
  markAllNotificationsAsReadController,
} from "../controllers/notification.controller";

const router = Router();

router.use(requireAuth);

router.get("/unread-count", getUnreadNotificationCountController);

router.patch("/read-all", markAllNotificationsAsReadController);

router.patch("/:id/read", markAllNotificationsAsReadController);

router.get("/", getMyNotificationsController);

export default router;
