import { useListContext } from "ra-core";

import { Task } from "./Task";

export const TasksIterator = ({
  showContact,
  className,
}: {
  showContact?: boolean;
  className?: string;
}) => {
  const { data, error, isPending } = useListContext();
  if (isPending || error || data.length === 0) return null;

  // Keep only tasks that are not done or done today (since done_date is date-only)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayString = today.toISOString().split('T')[0];

  const tasks = data.filter(
    (task) =>
      !task.done_date ||
      task.done_date.split('T')[0] === todayString,
  );

  return (
    <div className={`space-y-2 ${className || ""}`}>
      {tasks.map((task) => (
        <Task task={task} showContact={showContact} key={task.id} />
      ))}
    </div>
  );
};
