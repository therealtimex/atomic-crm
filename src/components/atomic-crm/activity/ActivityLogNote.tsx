import { type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ActivityLogContactNoteCreatedProps = {
  header: ReactNode;
  text: string;
};

export function ActivityLogNote({
  header,
  text,
}: ActivityLogContactNoteCreatedProps) {
  if (!text) {
    return null;
  }

  return (
    <div className="p-0">
      <div className="flex flex-col space-y-2 w-full">
        <div className="flex flex-row space-x-1 items-center w-full">
          {header}
        </div>
        <div className="prose prose-sm max-w-none dark:prose-invert line-clamp-3 overflow-hidden">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {text}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
