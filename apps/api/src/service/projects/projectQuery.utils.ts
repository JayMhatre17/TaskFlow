import { db } from "../../prisma/db";
import { ProjectQueryInput } from "../../schema/project.schema";

export const applyProjectSorting = (
  query: typeof db.orm.public.Project,
  sortBy: ProjectQueryInput["sortBy"],
  sortOrder: ProjectQueryInput["sortOrder"],
) => {
  switch (sortBy) {
    case "name":
      return query.orderBy((p) =>
        sortOrder === "asc" ? p.name.asc() : p.name.desc(),
      );

    case "status":
      return query.orderBy((p) =>
        sortOrder === "asc" ? p.status.asc() : p.status.desc(),
      );

    case "startDate":
      return query.orderBy((p) =>
        sortOrder === "asc" ? p.startDate.asc() : p.startDate.desc(),
      );

    case "dueDate":
      return query.orderBy((p) =>
        sortOrder === "asc" ? p.dueDate.asc() : p.dueDate.desc(),
      );

    case "createdAt":
      return query.orderBy((p) =>
        sortOrder === "asc" ? p.createdAt.asc() : p.createdAt.desc(),
      );

    case "updatedAt":
      return query.orderBy((p) =>
        sortOrder === "asc" ? p.updatedAt.asc() : p.updatedAt.desc(),
      );
  }
};
