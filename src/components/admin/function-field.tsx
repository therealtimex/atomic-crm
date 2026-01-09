import { HTMLAttributes, ReactNode } from "react";
import { useRecordContext } from "ra-core";
import { FieldProps } from "@/lib/field.type";

/**
 * Field using a render function to display the value.
 *
 * @example
 * <FunctionField render={record => `${record.first_name} ${record.last_name}`} />
 */
export const FunctionField = <
    RecordType extends Record<string, any> = Record<string, any>,
>({
    className,
    record: recordProps,
    render,
    source,
    ...rest
}: FunctionFieldProps<RecordType>) => {
    const record = useRecordContext<RecordType>(recordProps);
    if (!record) return null;
    return (
        <span className={className} {...rest}>
            {render(record, source)}
        </span>
    );
};

export interface FunctionFieldProps<
    RecordType extends Record<string, any> = Record<string, any>,
> extends Omit<FieldProps<RecordType>, "source">,
    HTMLAttributes<HTMLSpanElement> {
    render: (record: RecordType, source?: string) => ReactNode;
    source?: string;
}
