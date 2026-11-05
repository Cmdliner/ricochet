import { requestLoginCodeSchema } from "@ricochet/shared";
import { router } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";
import { AuthScreen } from "@/components/auth-screen";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { api, errorMessage } from "@/lib/api";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const parsed = requestLoginCodeSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid email address.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api("/auth/request-code", { method: "POST", body: parsed.data });
      router.push({ pathname: "/verify", params: { email: parsed.data.email } });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthScreen
      title="Welcome to Ricochet"
      subtitle="Enter your email and we will send you a code to sign in. No password needed."
      footer={<Text className="text-center text-sm text-muted">By continuing you agree to our terms and privacy policy.</Text>}
    >
      <TextField
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          if (error) setError(null);
        }}
        error={error}
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      <Button label="Continue" onPress={submit} loading={busy} />
    </AuthScreen>
  );
}
