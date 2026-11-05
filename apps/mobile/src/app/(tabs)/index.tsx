import { HubsArt } from "@/components/illustrations/empty-art";
import { Screen } from "@/components/screen";

export default function Hubs() {
  return (
    <Screen
      title="Hubs"
      art={<HubsArt />}
      emptyTitle="No hubs yet"
      emptyBody="Create a hub for your community, or join one with an invite link."
    />
  );
}
