import { datatype, lorem, random } from "faker/locale/en_US";

import {
  defaultTaskStatuses,
  defaultTaskTypes,
} from "../../../root/defaultConfiguration";
import type { Db } from "./types";
import { randomDate } from "./utils";

type TaskType = (typeof defaultTaskTypes)[number];

export const type: TaskType[] = [
  "Email",
  "Email",
  "Email",
  "Email",
  "Email",
  "Email",
  "Call",
  "Call",
  "Call",
  "Call",
  "Call",
  "Call",
  "Call",
  "Call",
  "Call",
  "Call",
  "Call",
  "Demo",
  "Lunch",
  "Meeting",
  "Follow-up",
  "Follow-up",
  "Thank you",
  "Ship",
  "None",
];

export const generateTasks = (db: Db) => {
  const tasks = Array.from(Array(400).keys()).map<any>((id) => {
    // Randomly choose entity type: contact (60%), company (20%), deal (15%), none (5%)
    const entityTypeRandom = Math.random();
    const entityType =
      entityTypeRandom < 0.6
        ? "contact"
        : entityTypeRandom < 0.8
          ? "company"
          : entityTypeRandom < 0.95
            ? "deal"
            : "none";

    let contact_id = null;
    let company_id = null;
    let deal_id = null;
    let sales_id = null;
    let contact = null;
    let company = null;
    let deal = null;

    // Set the appropriate entity ID based on entity type
    if (entityType === "contact") {
      contact = random.arrayElement(db.contacts);
      contact_id = contact.id;
      sales_id = contact.sales_id;
      company = db.companies.find((c) => c.id === contact.company_id);
      contact.nb_tasks++;
    } else if (entityType === "company") {
      company = random.arrayElement(db.companies);
      company_id = company.id;
      sales_id = company.sales_id;
    } else if (entityType === "deal") {
      deal = random.arrayElement(db.deals);
      deal_id = deal.id;
      sales_id = deal.sales_id;
      company = db.companies.find((c) => c.id === deal.company_id);
    } else {
      // None - standalone task
      const randomSales = random.arrayElement(db.sales);
      sales_id = randomSales.id;
    }

    const creator = db.sales.find((s) => s.id === sales_id);
    const baseDate =
      contact?.first_seen || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

    const createdDate = randomDate(new Date(baseDate)).toISOString();
    const dueDate = randomDate(
      datatype.boolean() ? new Date() : new Date(baseDate),
      new Date(Date.now() + 100 * 24 * 60 * 60 * 1000),
    ).toISOString();

    const isDone = datatype.boolean();
    const doneDate = isDone
      ? randomDate(new Date(createdDate)).toISOString()
      : undefined;

    return {
      id,
      contact_id,
      company_id,
      deal_id,
      type: random.arrayElement(defaultTaskTypes),
      text: lorem.sentence(),
      due_date: dueDate,
      done_date: doneDate,
      sales_id,
      priority: random.arrayElement(["low", "medium", "high", "urgent"]),
      assigned_to: sales_id,
      status: isDone ? "done" : "todo",
      created_at: createdDate,
      updated_at: createdDate,
      archived: false,
      index: 0,

      // Denormalized fields for TaskSummary simulation
      contact_first_name: contact?.first_name,
      contact_last_name: contact?.last_name,
      contact_email: contact?.email_jsonb?.[0]?.email,
      company_id_computed: company?.id,
      company_name: company?.name,
      deal_name: deal?.name,
      creator_first_name: creator?.first_name,
      creator_last_name: creator?.last_name,
      assigned_first_name: creator?.first_name,
      assigned_last_name: creator?.last_name,
    };
  });

  defaultTaskStatuses.forEach((status) => {
    tasks
      .filter((task) => task.status === status.id)
      .forEach((task, index) => {
        tasks[task.id].index = index;
      });
  });

  return tasks;
};
