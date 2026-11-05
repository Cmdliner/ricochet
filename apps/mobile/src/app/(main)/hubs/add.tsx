import { router } from "expo-router";
import { View } from "react-native";
import { Sheet } from "@/components/ui/sheet";
import { SheetRow } from "@/components/ui/sheet-row";

/** The choice behind the plus button: start something new or join something that exists. */
export default function AddHub() {
  return (
    <Sheet title="Add a hub" scroll={false}>
      <View className="gap-3 pb-2">
        <SheetRow
          icon="sparkles"
          title="Create a hub"
          subtitle="Start a space for your community"
          onPress={() => router.replace("/hubs/new")}
        />
        <SheetRow
          icon="link"
          title="Join with a code"
          subtitle="Someone invited you? Enter their code"
          onPress={() => router.replace("/hubs/join")}
        />
      </View>
    </Sheet>
  );
}
