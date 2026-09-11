import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "../ui/Popover";
import { Bell } from "lucide-react";
import { Button } from "../ui/button";

const NotificationPopover = () => {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifications"
            className="cursor-pointer"
          />
        }
      >
        <Bell size={20} />
      </PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Notifications</PopoverTitle>
        </PopoverHeader>
        <div className="py-6 text-center text-sm text-gray-500">
          No new notifications
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationPopover;
