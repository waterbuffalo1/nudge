import { config } from "dotenv";
import { resolve } from "path";
import { listActivitySubmissions } from "../src/lib/activity-submissions";

config({ path: resolve(process.cwd(), ".env") });

const statusArg = process.argv[2];
const status =
  statusArg === "open" || statusArg === "done" ? statusArg : "open";

listActivitySubmissions(status)
  .then((submissions) => {
    if (submissions.length === 0) {
      console.log(`No ${status} activity submissions.`);
      return;
    }

    console.log(`${status} activity submissions (${submissions.length}):\n`);

    for (const item of submissions) {
      const emoji = item.emoji ? ` ${item.emoji}` : "";
      const done = item.doneMessage ? ` — "${item.doneMessage}"` : "";
      console.log(
        `${item.id}. [${item.categorySlug}] ${item.name}${emoji}${done}`,
      );
      console.log(`   created: ${item.createdAt}`);
      if (item.activitySlug) {
        console.log(`   activity slug: ${item.activitySlug}`);
      }
      console.log("");
    }
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
