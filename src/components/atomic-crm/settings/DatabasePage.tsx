import { DatabaseSettings } from "./DatabaseSettings";

export const DatabasePage = () => {
  return (
    <div className="max-w-lg mx-auto mt-8">
      <DatabaseSettings />
    </div>
  );
};

DatabasePage.path = "/database";
