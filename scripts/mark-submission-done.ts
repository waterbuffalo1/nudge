import { config } from "dotenv";
import { resolve } from "path";
import { updateActivitySubmissionStatus } from "../src/lib/activity-submissions";

config({ path: resolve(process.cwd(), ".env") });

const id = Number(process.argv[2]);

if (!Number.isInteger(id) || id <= 0) {
  console.error("Usage: npm run submissions:done -- <id>");
  process.exit(1);
}

updateActivitySubmissionStatus(id, "done")
  .then((submission) => {
    console.log(`Marked submission ${submission.id} as done.`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
