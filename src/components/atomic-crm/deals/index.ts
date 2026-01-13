import type { Deal } from "../types";
import DealList from "./DealList";
import { DealShow } from "./DealShow";

export default {
  list: DealList,
  show: DealShow,
  recordRepresentation: (record: Deal) => record?.name || "",
};
