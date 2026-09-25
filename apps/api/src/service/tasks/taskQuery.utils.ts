import { db } from "../../prisma/db";
import { TaskQueryInput } from "../../schema/task.schema";

export const applyTaskSorting = (
  query: typeof db.orm.public.Task,
  sortBy: TaskQueryInput["sortBy"],
  sortOrder: TaskQueryInput["sortOrder"],
) => {
  switch (sortBy) {
    case "title":
      return query.orderBy((t) =>
        sortOrder === "asc" ? t.title.asc() : t.title.desc(),
      );

    case "status":
      return query.orderBy((t) =>
        sortOrder === "asc" ? t.status.asc() : t.status.desc(),
      );

    case "priority":
      return query.orderBy((t) =>
        sortOrder === "asc" ? t.priority.asc() : t.priority.desc(),
      );

    case "dueDate":
      return query.orderBy((t) =>
        sortOrder === "asc" ? t.dueDate.asc() : t.dueDate.desc(),
      );

    case "createdAt":
      return query.orderBy((t) =>
        sortOrder === "asc" ? t.createdAt.asc() : t.createdAt.desc(),
      );

    case "updatedAt":
      return query.orderBy((t) =>
        sortOrder === "asc" ? t.updatedAt.asc() : t.updatedAt.desc(),
      );
  }
};
