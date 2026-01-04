import { Droppable } from "@hello-pangea/dnd";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Task } from "../types";
import { findStatusLabel } from "./tasks";
import { TaskCard } from "./TaskCard";

export const TaskColumn = ({
    status,
    tasks,
    isDropDisabled,
    isCollapsed,
    onToggleCollapse,
}: {
    status: string;
    tasks: Task[];
    isDropDisabled?: boolean;
    isCollapsed?: boolean;
    onToggleCollapse?: (statusId: string) => void;
}) => {
    const { taskStatuses } = useConfigurationContext();
    const label = findStatusLabel(taskStatuses, status);
    const count = tasks.length;
    const collapsed = isCollapsed ?? false;

    return (
        <div
            className={cn(
                "flex flex-col h-full transition-[width] duration-200",
                collapsed ? "w-12 flex-none" : "flex-1 min-w-0",
            )}
        >
            <div
                className={cn(
                    "sticky top-0 z-10 flex items-center border-b bg-background/95 backdrop-blur",
                    collapsed ? "justify-center mx-1 rounded-full" : "justify-between px-2",
                )}
            >
                {collapsed ? (
                    <button
                        type="button"
                        onClick={() => onToggleCollapse?.(status)}
                        className="flex flex-col items-center gap-2 py-2 text-muted-foreground hover:text-foreground"
                        aria-label={`Expand ${label} column`}
                    >
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                            {count}
                        </span>
                        <span className="[writing-mode:vertical-rl] rotate-180 text-[10px] font-semibold tracking-wide uppercase">
                            {label}
                        </span>
                        <ChevronRight className="h-3 w-3" />
                    </button>
                ) : (
                    <>
                        <h3 className="text-sm font-semibold flex items-center gap-2 min-w-0 py-2">
                            <span className="truncate">{label}</span>
                            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                                {count}
                            </span>
                        </h3>
                        <button
                            type="button"
                            onClick={() => onToggleCollapse?.(status)}
                            className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted"
                            aria-label={`Collapse ${label} column`}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                    </>
                )}
            </div>

            <Droppable droppableId={status} isDropDisabled={isDropDisabled}>
                {(droppableProvided, snapshot) => (
                    <div
                        ref={droppableProvided.innerRef}
                        {...droppableProvided.droppableProps}
                        className={cn(
                            "flex-1 flex flex-col rounded-xl gap-3 min-h-[150px] transition-colors p-2",
                            snapshot.isDraggingOver ? "bg-muted/50" : "bg-muted/20",
                            collapsed && "px-1",
                        )}
                    >
                        {!collapsed &&
                            tasks.map((task, index) => (
                                <TaskCard key={task.id} task={task} index={index} />
                            ))}
                        {droppableProvided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
};
