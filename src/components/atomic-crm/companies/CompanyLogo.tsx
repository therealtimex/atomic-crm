import { useRecordContext } from "ra-core";
import type { Company } from "../types";

export const CompanyLogo = (props: {
  record?: Company;
  className?: string;
}) => {
  const record = useRecordContext<Company>(props);
  if (!record) return null;

  if (record.logo?.src) {
    return (
      <div className={props.className}>
        <img
          src={record.logo.src}
          alt={record.name}
          className="max-h-16 object-contain"
        />
      </div>
    );
  }

  return (
    <div
      className={`p-2 bg-muted rounded font-bold text-xl ${props.className}`}
    >
      {record.name}
    </div>
  );
};
