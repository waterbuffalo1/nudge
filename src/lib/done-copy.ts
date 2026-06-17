import type { Activity } from "@/lib/activities";

export const DEFAULT_DONE_TITLE = "done! 🎉";
export const DEFAULT_DONE_MESSAGE = "you just made your life better";

export type DoneCopy = {
  title: string;
  message: string;
};

export function getDoneCopy(activity: Activity): DoneCopy {
  return {
    title: activity.doneTitle ?? DEFAULT_DONE_TITLE,
    message: activity.doneMessage ?? DEFAULT_DONE_MESSAGE,
  };
}
