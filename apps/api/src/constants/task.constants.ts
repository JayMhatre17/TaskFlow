export const TASK_STATUS = {
  TODO: 1,
  IN_PROGRESS: 2,
  IN_REVIEW: 3,
  COMPLETED: 4,
} as const;

export const TASK_PRIORITY = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  URGENT: 4,
} as const;

export const TASK_STATUS_LABEL = {
  1: "TODO",
  2: "IN_PROGRESS",
  3: "IN_REVIEW",
  4: "COMPLETED",
} as const;

export const TASK_PRIORITY_LABEL = {
  1: "LOW",
  2: "MEDIUM",
  3: "HIGH",
  4: "URGENT",
} as const;

export const getTaskStatusLabel = (status: number) => {
  const label = TASK_STATUS_LABEL[status as keyof typeof TASK_STATUS_LABEL];

  if (!label) {
    throw new Error(`Invalid task status: ${status}`);
  }

  return label;
};

export const getTaskPriorityLabel = (priority: number) => {
  const label =
    TASK_PRIORITY_LABEL[priority as keyof typeof TASK_PRIORITY_LABEL];

  if (!label) {
    throw new Error(`Invalid task priority: ${priority}`);
  }

  return label;
};
