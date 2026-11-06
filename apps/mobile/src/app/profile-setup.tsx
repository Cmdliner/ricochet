import { authUserSchema, completeProfileSchema } from "@ricochet/shared";
import { useState } from "react";
import { AuthScreen } from "@/components/auth-screen";
import { ProfileArt } from "@/components/illustrations/profile-art";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { api, ApiError, errorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

type FieldErrors = { displayName?: string; handle?: string };

export default function ProfileSetup() {
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);

  async function submit() {
    const parsed = completeProfileSchema.safeParse({ displayName, handle });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof FieldErrors;
        next[field] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setBusy(true);
    setErrors({});
    try {
      const user = await api("/me", { method: "PATCH", auth: true, body: parsed.data, schema: authUserSchema });
      // Completing the profile flips the route guard, which opens the main app.
      useAuthStore.getState().setUser(user);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setErrors({ handle: e.message });
      else setErrors({ displayName: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthScreen
      art={<ProfileArt />}
      title="Set up your profile"
      subtitle="Choose how people see you. You can change this later."
      footer={
        <Button variant="ghost" className="px-6" label="Sign out" onPress={() => void useAuthStore.getState().signOut()} />
      }
    >
      <TextField
        label="Your name"
        placeholder="Ada Lovelace"
        value={displayName}
        onChangeText={setDisplayName}
        error={errors.displayName}
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
      />
      <TextField
        label="Handle"
        placeholder="ada_l"
        value={handle}
        onChangeText={(value) => setHandle(value.toLowerCase())}
        error={errors.handle}
        hint="Letters, numbers and underscores. People can find you with it."
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      <Button label="Continue" onPress={submit} loading={busy} />
    </AuthScreen>
  );
}
