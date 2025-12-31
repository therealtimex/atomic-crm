import * as React from "react";
import type { Deal } from "../types";
const DealList = React.lazy(() => import("./DealList"));
import { DealShow } from "./DealShow";

export default {
  list: DealList,
  show: DealShow,
  recordRepresentation: (record: Deal) => record?.name || "",
};
