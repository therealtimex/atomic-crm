import type { Task } from "../types";
import type { ConfigurationContextValue } from "../root/ConfigurationContext";

export type TasksByStatus = Record<string, Task[]>;

export const OTHER_TASK_STATUS_ID = "other";
export const OTHER_TASK_STATUS_LABEL = "Other";

export const getTasksByStatus = (
  unorderedTasks: Task[],
  taskStatuses: ConfigurationContextValue["taskStatuses"],
  options?: { includeOther?: boolean },
) => {
  if (!taskStatuses) return {};

  const includeOther = options?.includeOther ?? false;
  const tasksByStatusSeed = taskStatuses.reduce(
    (obj, status) => ({ ...obj, [status.id]: [] }),
    {} as Record<string, Task[]>,
  );
  if (includeOther && !tasksByStatusSeed[OTHER_TASK_STATUS_ID]) {
    tasksByStatusSeed[OTHER_TASK_STATUS_ID] = [];
  }

  const tasksByStatus: Record<string, Task[]> = unorderedTasks.reduce(
    (acc, task) => {
      const status = task.status || "todo";
      if (acc[status]) {
        acc[status].push(task);
      } else if (includeOther) {
        acc[OTHER_TASK_STATUS_ID].push(task);
      }
      return acc;
    },
    tasksByStatusSeed,
  );

  // order each column by index, then due date
  Object.keys(tasksByStatus).forEach((statusId) => {
    tasksByStatus[statusId] = tasksByStatus[statusId].sort((recordA, recordB) => {
      const indexA =
        typeof recordA.index === "number" ? recordA.index : Number.POSITIVE_INFINITY;
      const indexB =
        typeof recordB.index === "number" ? recordB.index : Number.POSITIVE_INFINITY;
      if (indexA !== indexB) return indexA - indexB;

      if (!recordA.due_date) return 1;
      if (!recordB.due_date) return -1;
      return (
        new Date(recordA.due_date).getTime() -
        new Date(recordB.due_date).getTime()
      );
    });
  });

  return tasksByStatus;
};

export const findStatusLabel = (
  taskStatuses: ConfigurationContextValue["taskStatuses"],
  statusId: string,
) => {
  if (statusId === OTHER_TASK_STATUS_ID) return OTHER_TASK_STATUS_LABEL;
  const status = taskStatuses.find((s) => s.id === statusId);
  return status ? status.name : statusId;
};
