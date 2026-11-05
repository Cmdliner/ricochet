import { joinHubSchema } from "@ricochet/shared";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { ScreenHeader } from "@/components/ui/screen-header";
import { TextField } from "@/components/ui/text-field";
import { useHubsStore } from "@/features/hubs/store";

export default function JoinHub() {
  const joinHub = useHubsStore((s) => s.joinHub);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const parsed = joinHubSchema.safeParse({ code });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter an invite code.");
      return;
    }
    const hub = joinHub(parsed.data.code);
    if (!hub) {
      setError("That invite code did not work. Check it and try again.");
      return;
    }
    router.replace(`/hub/${hub.id}`);
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <ScreenHeader title="Join a hub" closeStyle />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerClassName="gap-6 px-5 pt-8 pb-10" keyboardShouldPersistTaps="handled">
          <View className="gap-2">
            <Text className="text-[28px] font-bold tracking-tight text-ink">Got an invite code?</Text>
            <Text className="text-base leading-6 text-muted">
              Ask the person who invited you, or open their invite link on this phone.
            </Text>
          </View>

          <TextField
            label="Invite code"
            placeholder="BOUNCE"
            value={code}
            onChangeText={(value) => {
              setCode(value.toUpperCase());
              if (error) setError(null);
            }}
            error={error}
            hint="This preview has one hub to find. Try BOUNCE."
            autoCapitalize="characters"
            autoCorrect={false}
            autoFocus
            maxLength={12}
            returnKeyType="go"
            onSubmitEditing={submit}
            className="text-center text-xl font-semibold tracking-[4px]"
          />
          <Button label="Join hub" onPress={submit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
