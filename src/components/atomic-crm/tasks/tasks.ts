import type { Task } from "../types";
import type { ConfigurationContextValue } from "../root/ConfigurationContext";

export type TasksByStatus = Record<string, Task[]>;

export const getTasksByStatus = (
  unorderedTasks: Task[],
  taskStatuses: ConfigurationContextValue["taskStatuses"],
) => {
  if (!taskStatuses) return {};
  
  const tasksByStatus: Record<string, Task[]> = unorderedTasks.reduce(
    (acc, task) => {
      const status = task.status || "todo";
      if (acc[status]) {
        acc[status].push(task);
      }
      return acc;
    },
    taskStatuses.reduce(
      (obj, status) => ({ ...obj, [status.id]: [] }),
      {} as Record<string, Task[]>,
    ),
  );

  // order each column by due date
  taskStatuses.forEach((status) => {
    tasksByStatus[status.id] = tasksByStatus[status.id].sort(
      (recordA: Task, recordB: Task) => {
        if (!recordA.due_date) return 1;
        if (!recordB.due_date) return -1;
        return new Date(recordA.due_date).getTime() - new Date(recordB.due_date).getTime();
      },
    );
  });
  
  return tasksByStatus;
};

export const findStatusLabel = (
  taskStatuses: ConfigurationContextValue["taskStatuses"],
  statusId: string,
) => {
  const status = taskStatuses.find((s) => s.id === statusId);
  return status ? status.name : statusId;
};
