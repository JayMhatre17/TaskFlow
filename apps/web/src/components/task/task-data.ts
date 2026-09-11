export type Task = {
  id: string;
  title: string;
  project: string;
  status: "Pending" | "In Progress" | "Completed";
  priority: "High" | "Medium" | "Low";
  assignee: string;
  dueDate: string;
};

export const tasks: Task[] = [
  {
    id: "1",
    title: "Build dashboard",
    project: "TaskFlow Website",
    status: "In Progress",
    priority: "High",
    assignee: "John Doe",
    dueDate: "Sep 10, 2026",
  },
  {
    id: "2",
    title: "Create login page",
    project: "TaskFlow Website",
    status: "Completed",
    priority: "Medium",
    assignee: "Sarah Smith",
    dueDate: "Sep 8, 2026",
  },
  {
    id: "3",
    title: "Fix mobile layout",
    project: "Mobile App",
    status: "Pending",
    priority: "High",
    assignee: "Mike Johnson",
    dueDate: "Sep 12, 2026",
  },
  {
    id: "4",
    title: "API integration",
    project: "Admin Portal",
    status: "In Progress",
    priority: "High",
    assignee: "John Doe",
    dueDate: "Sep 15, 2026",
  },
  {
    id: "5",
    title: "Write documentation",
    project: "TaskFlow Website",
    status: "Pending",
    priority: "Low",
    assignee: "Sarah Smith",
    dueDate: "Sep 18, 2026",
  },
];

export const taskDetails = {
  id: "1",
  title: "Build dashboard",
  description:
    "Build the main dashboard UI for the TaskFlow workspace management platform.",
  project: {
    id: "1",
    name: "TaskFlow Website",
  },
  status: "In Progress",
  priority: "High",
  assignee: {
    id: "1",
    name: "John Doe",
  },
  startDate: "Sep 1, 2026",
  dueDate: "Sep 10, 2026",
  createdAt: "Aug 28, 2026",
};
