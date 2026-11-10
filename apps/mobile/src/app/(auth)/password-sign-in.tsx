import { authResponseSchema, passwordLoginSchema } from "@ricochet/shared";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable } from "react-native";
import { AuthScreen } from "@/components/auth-screen";
import { WelcomeArt } from "@/components/illustrations/welcome-art";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { TextField } from "@/components/ui/text-field";
import { api, errorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export default function PasswordSignIn() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const parsed = passwordLoginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your email and password.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const session = await api("/auth/password-login", { method: "POST", body: parsed.data, schema: authResponseSchema });
      // Signing in flips the route guard, which moves the app to the next screen by itself.
      await useAuthStore.getState().signIn(session);
    } catch (e) {
      setError(errorMessage(e));
      setPassword("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthScreen
      art={<WelcomeArt />}
      title="Sign in with a password"
      subtitle="Use the password you set in your profile. If you have not set one, or forgot it, an emailed code gets you in."
      footer={
        <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={8}>
          <Text className="text-center text-base font-sans-semibold text-accent-text">Email me a code instead</Text>
        </Pressable>
      }
    >
      <TextField
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          if (error) setError(null);
        }}
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={(value) => {
          setPassword(value);
          if (error) setError(null);
        }}
        error={error}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        autoCorrect={false}
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      <Button label="Sign in" onPress={submit} loading={busy} />
    </AuthScreen>
  );
}
