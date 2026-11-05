import { authResponseSchema, LIMITS, verifyLoginCodeSchema } from "@ricochet/shared";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Text } from "react-native";
import { AuthScreen } from "@/components/auth-screen";
import { MailArt } from "@/components/illustrations/mail-art";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { api, errorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

const RESEND_SECONDS = LIMITS.loginCodeResendGapMs / 1000;

export default function Verify() {
  // `code` is only present when the person tapped the link in the email.
  const params = useLocalSearchParams<{ email?: string; code?: string }>();
  const email = params.email ?? "";

  const [code, setCode] = useState(params.code ?? "");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const submitting = useRef(false);

  const submit = useCallback(
    async (value: string) => {
      if (submitting.current) return;
      const parsed = verifyLoginCodeSchema.safeParse({ email, code: value });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Enter the code from your email.");
        return;
      }
      submitting.current = true;
      setBusy(true);
      setError(null);
      try {
        const session = await api("/auth/verify", { method: "POST", body: parsed.data, schema: authResponseSchema });
        // Signing in flips the route guard, which moves the app to the next screen by itself.
        await useAuthStore.getState().signIn(session);
      } catch (e) {
        setError(errorMessage(e));
        setCode("");
      } finally {
        submitting.current = false;
        setBusy(false);
      }
    },
    [email],
  );

  // Opened from the email link: the code is already filled in, so sign in right away.
  const autoSubmitted = useRef(false);
  useEffect(() => {
    if (params.code && !autoSubmitted.current) {
      autoSubmitted.current = true;
      void submit(params.code);
    }
  }, [params.code, submit]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  async function resend() {
    setError(null);
    setNotice(null);
    try {
      await api("/auth/request-code", { method: "POST", body: { email } });
      setNotice("We sent you a new code.");
      setSecondsLeft(RESEND_SECONDS);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <AuthScreen
      art={<MailArt />}
      title="Check your email"
      subtitle={`We sent a ${LIMITS.loginCodeLength} digit code to ${email}. Enter it below, or tap the link in the email.`}
      footer={
        <>
          <Button
            variant="ghost"
            className="px-6"
            label={secondsLeft > 0 ? `Send a new code in ${secondsLeft}s` : "Send a new code"}
            disabled={secondsLeft > 0}
            onPress={resend}
          />
          <Button variant="ghost" className="px-6" label="Use a different email" onPress={() => router.back()} />
        </>
      }
    >
      <TextField
        label="Code"
        placeholder="000000"
        value={code}
        onChangeText={(value) => {
          const digits = value.replace(/\D/g, "").slice(0, LIMITS.loginCodeLength);
          setCode(digits);
          if (error) setError(null);
          if (digits.length === LIMITS.loginCodeLength) void submit(digits);
        }}
        error={error}
        autoFocus
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={LIMITS.loginCodeLength}
        className="text-center text-2xl font-semibold tracking-[8px]"
      />
      {notice ? <Text className="text-sm text-muted">{notice}</Text> : null}
      <Button label="Verify" onPress={() => submit(code)} loading={busy} />
    </AuthScreen>
  );
}
