import { authUserSchema, passwordSchema, type AuthUser } from "@ricochet/shared";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Text } from "@/components/ui/text";
import { TextField } from "@/components/ui/text-field";
import { api, errorMessage } from "@/lib/api";
import { showDialog } from "@/lib/dialog";
import { useAuthStore } from "@/stores/auth-store";

export default function PasswordSheet() {
  const hasPassword = useAuthStore((s) => s.user?.hasPassword ?? false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(request: () => Promise<AuthUser>, done: { title: string; message: string }) {
    setBusy(true);
    setError(null);
    try {
      useAuthStore.getState().setUser(await request());
      router.back();
      showDialog(done.title, done.message);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  function save() {
    if (hasPassword && !current) return setError("Enter your current password.");
    const parsed = passwordSchema.safeParse(next);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Choose a longer password.");
    if (next !== confirm) return setError("The two passwords do not match.");
    void run(
      () => api("/auth/password", { auth: true, method: "PUT", body: { password: next, currentPassword: hasPassword ? current : undefined }, schema: authUserSchema }),
      hasPassword
        ? { title: "Password changed", message: "Your other devices were signed out. This one stays signed in." }
        : { title: "Password saved", message: "You can now sign in with your email and password. Emailed codes still work too." },
    );
  }

  function remove() {
    if (!current) return setError("Enter your current password to remove it.");
    showDialog("Remove your password?", "You will sign in with an emailed code again.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () =>
          void run(() => api("/auth/password", { auth: true, method: "DELETE", body: { password: current }, schema: authUserSchema }), {
            title: "Password removed",
            message: "You will sign in with an emailed code.",
          }),
      },
    ]);
  }

  return (
    <Sheet title={hasPassword ? "Change password" : "Set a password"}>
      <View className="gap-4 pb-2">
        <Text className="text-sm text-muted">
          Sign in with your email and a password instead of waiting for a code. Emailed codes keep working, so you can always get back in.
        </Text>

        {hasPassword ? (
          <TextField
            label="Current password"
            value={current}
            onChangeText={setCurrent}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            autoCorrect={false}
            textContentType="password"
          />
        ) : null}
        <TextField
          label={hasPassword ? "New password" : "Password"}
          hint="At least 8 characters."
          value={next}
          onChangeText={setNext}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          autoCorrect={false}
          textContentType="newPassword"
        />
        <TextField
          label="Type it again"
          value={confirm}
          onChangeText={setConfirm}
          error={error}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          autoCorrect={false}
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={save}
        />

        <Button label={hasPassword ? "Change password" : "Set password"} loading={busy} onPress={save} />
        {hasPassword ? <Button label="Remove password" variant="ghost" onPress={remove} /> : null}
      </View>
    </Sheet>
  );
}
