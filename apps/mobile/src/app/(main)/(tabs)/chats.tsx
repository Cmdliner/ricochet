import { ChatsArt } from "@/components/illustrations/empty-art";
import { Screen } from "@/components/screen";

export default function Chats() {
  return (
    <Screen
      title="Chats"
      art={<ChatsArt width={240} />}
      emptyTitle="Your private chats live here"
      emptyBody="One-to-one conversations with the people you know, away from the noise of a hub."
      hints={[
        { icon: "chatbubble-ellipses-outline", label: "Messages" },
        { icon: "mic-outline", label: "Voice notes" },
        { icon: "videocam-outline", label: "Video notes" },
      ]}
    />
  );
}
