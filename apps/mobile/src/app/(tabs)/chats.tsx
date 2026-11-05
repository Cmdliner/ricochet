import { ChatsArt } from "@/components/illustrations/empty-art";
import { Screen } from "@/components/screen";

export default function Chats() {
  return (
    <Screen
      title="Chats"
      art={<ChatsArt />}
      emptyTitle="No chats yet"
      emptyBody="Start a private chat to send messages, voice notes and video notes."
    />
  );
}
