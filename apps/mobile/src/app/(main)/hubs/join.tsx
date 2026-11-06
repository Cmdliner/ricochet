import { joinHubSchema } from "@ricochet/shared";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Text } from "@/components/ui/text";
import { errorMessage } from "@/lib/api";
import { TextField } from "@/components/ui/text-field";
import { useHubsStore } from "@/features/hubs/store";

export default function JoinHub() {
  const joinHub = useHubsStore((s) => s.joinHub);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const parsed = joinHubSchema.safeParse({ code });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter an invite code.");
      return;
    }
    setBusy(true);
    try {
      const hub = await joinHub(parsed.data.code);
      router.replace(`/hub/${hub.id}`);
    } catch (caught) {
      setError(errorMessage(caught));
      setBusy(false);
    }
  }

  return (
    <Sheet title="Join a hub" scroll={false}>
      <View className="gap-5 pt-1 pb-2">
        <Text className="text-base leading-6 text-muted">
          Ask the person who invited you for their code, or open their invite link on this phone.
        </Text>
        <TextField
          label="Invite code"
          placeholder="BOUNCE"
          value={code}
          onChangeText={(value) => {
            setCode(value.toUpperCase());
            if (error) setError(null);
          }}
          error={error}
          autoCapitalize="characters"
          autoCorrect={false}
          autoFocus
          maxLength={12}
          returnKeyType="go"
          onSubmitEditing={submit}
          className="text-center font-sans-semibold text-xl tracking-[4px]"
        />
        <Button label="Join hub" onPress={submit} loading={busy} />
      </View>
    </Sheet>
  );
}
