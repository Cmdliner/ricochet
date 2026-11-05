import { ActivityArt } from "@/components/illustrations/empty-art";
import { Screen } from "@/components/screen";

export default function Activity() {
  return (
    <Screen
      title="Activity"
      art={<ActivityArt />}
      emptyTitle="You are all caught up"
      emptyBody="Mentions, replies, invites and announcements will show up here."
    />
  );
}
