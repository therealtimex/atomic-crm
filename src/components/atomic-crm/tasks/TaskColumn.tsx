import { Droppable } from "@hello-pangea/dnd";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Task } from "../types";
import { findStatusLabel } from "./tasks";
import { TaskCard } from "./TaskCard";

export const TaskColumn = ({
    status,
    tasks,
    isDropDisabled,
}: {
    status: string;
    tasks: Task[];
    isDropDisabled?: boolean;
}) => {
    const { taskStatuses } = useConfigurationContext();

    return (
        <div className="flex-1 flex flex-col min-w-[280px] h-full">
            <div className="flex items-center justify-between px-2 mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                    {findStatusLabel(taskStatuses, status)}
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                        {tasks.length}
                    </span>
                </h3>
            </div>

            <Droppable droppableId={status} isDropDisabled={isDropDisabled}>
                {(droppableProvided, snapshot) => (
                    <div
                        ref={droppableProvided.innerRef}
                        {...droppableProvided.droppableProps}
                        className={`flex-1 flex flex-col p-2 rounded-xl gap-3 min-h-[150px] transition-colors ${snapshot.isDraggingOver ? "bg-muted/50" : "bg-muted/20"
                            }`}
                    >
                        {tasks.map((task, index) => (
                            <TaskCard key={task.id} task={task} index={index} />
                        ))}
                        {droppableProvided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
};
