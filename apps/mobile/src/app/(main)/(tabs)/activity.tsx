import { ActivityArt } from "@/components/illustrations/empty-art";
import { Screen } from "@/components/screen";

export default function Activity() {
  return (
    <Screen
      title="Activity"
      art={<ActivityArt width={240} />}
      emptyTitle="You are all caught up"
      emptyBody="When someone mentions you, replies to you or invites you to a hub, you will see it here."
      hints={[
        { icon: "at-outline", label: "Mentions" },
        { icon: "return-up-back-outline", label: "Replies" },
        { icon: "mail-outline", label: "Invites" },
      ]}
    />
  );
}
