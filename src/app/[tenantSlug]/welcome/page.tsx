"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { Avatar, Button, Card, Wordmark } from "@/components/primitives";
import { FieldReconciler, type ReconcileChoice } from "@/components/pages/welcome";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useMyMembership, useUpdateMyMembership } from "@/lib/api/members";

type FieldState = { choice: ReconcileChoice; edited: string };

const asString = (v: unknown): string | null  => {
  return typeof v === "string" && v.length > 0 ? v : null;
}

const pick = (state: FieldState, existing: string | null, sso: string | null): string  => {
  if (state.choice === "existing") return existing ?? "";
  if (state.choice === "sso") return sso ?? "";
  return state.edited;
}

export default () => {
  const router = useRouter();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { user: firebaseUser, loading: authLoading } = useAuth();
  const { data: member, isLoading } = useMyMembership(tenantSlug);
  const { mutateAsync, isPending } = useUpdateMyMembership(tenantSlug);

  // Pre-split SSO display name on first whitespace for the
  // first/last-name reconciliation. If SSO only gave one name, the second
  // box treats SSO as missing — the user can fall back to existing or
  // type their own.
  const ssoName = useMemo(() => {
    const dn = firebaseUser?.displayName ?? "";
    const idx = dn.indexOf(" ");
    return {
      first: idx >= 0 ? dn.slice(0, idx) : dn,
      last: idx >= 0 ? dn.slice(idx + 1) : "",
    };
  }, [firebaseUser]);

  // Default each field to "use SSO" when SSO has a value, otherwise
  // "keep existing". This is the most common right answer, so the user
  // can usually just click Continue.
  const [first, setFirst] = useState<FieldState>({ choice: "existing", edited: "" });
  const [last, setLast] = useState<FieldState>({ choice: "existing", edited: "" });
  const [phone, setPhone] = useState<FieldState>({ choice: "existing", edited: "" });
  const [address, setAddress] = useState<FieldState>({ choice: "existing", edited: "" });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Initialise once member + auth resolve.
  useEffect(() => {
    if (saved || !member) return;
    const existingFirst = asString(member.firstName);
    const existingLast = asString(member.lastName);
    const existingPhone = asString(member.phone);
    const existingAddress = asString(member.address);
    setFirst({
      choice: ssoName.first ? "sso" : "existing",
      edited: ssoName.first || existingFirst || "",
    });
    setLast({
      choice: ssoName.last ? "sso" : "existing",
      edited: ssoName.last || existingLast || "",
    });
    setPhone({ choice: "existing", edited: existingPhone ?? "" });
    setAddress({ choice: "existing", edited: existingAddress ?? "" });
  }, [member, ssoName, saved]);

  const loading = authLoading || isLoading || !member;

  if (loading) {
    return (
      <Shell>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[80, "100%", "70%", "100%"].map((w, i) => (
            <div
              key={i}
              style={{ height: 18, width: w as string | number, background: S.surfaceContainer, borderRadius: 6 }}
            />
          ))}
        </div>
      </Shell>
    );
  }

  const existingFirst = asString(member.firstName);
  const existingLast = asString(member.lastName);
  const existingPhone = asString(member.phone);
  const existingAddress = asString(member.address);
  const ssoFirst = ssoName.first || null;
  const ssoLast = ssoName.last || null;

  const finalFirst = pick(first, existingFirst, ssoFirst).trim();
  const finalLast = pick(last, existingLast, ssoLast).trim();
  const finalPhone = pick(phone, existingPhone, null).trim();
  const finalAddress = pick(address, existingAddress, null).trim();

  const canSubmit = finalFirst.length > 0 && finalLast.length > 0;

  const handleContinue = async () => {
    setError(null);
    try {
      await mutateAsync({
        params: { path: { tenantId: tenantSlug } },
        body: {
          firstName: finalFirst,
          lastName: finalLast,
          // Empty string clears; undefined leaves untouched. We only
          // submit the field if user changed away from "existing", or
          // if the existing was empty.
          ...(phone.choice === "existing" && existingPhone === finalPhone
            ? {}
            : { phone: finalPhone || undefined }),
          ...(address.choice === "existing" && existingAddress === finalAddress
            ? {}
            : { address: finalAddress || undefined }),
        },
      });
      setSaved(true);
      router.push(`/${tenantSlug}/member/dashboard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile");
    }
  }

  return (
    <Shell>
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: S.onSurfaceMuted,
            marginBottom: 12,
          }}
        >
          Welcome
        </div>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: "-0.025em",
            color: S.onSurface,
            margin: "0 0 10px",
            lineHeight: 1.15,
          }}
        >
          Let&apos;s confirm your profile.
        </h1>
        <p style={{ margin: 0, fontSize: 15, color: S.onSurfaceVariant, lineHeight: 1.5 }}>
          Your church already has a profile for you. Pick which details to keep
          or replace with the ones from your Google account.
        </p>
      </div>

      <Card padding={24} style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Avatar
            name={firebaseUser?.displayName ?? firebaseUser?.email ?? "You"}
            src={firebaseUser?.photoURL ?? undefined}
            size={56}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: S.onSurface }}>
              Signed in as {firebaseUser?.displayName ?? firebaseUser?.email}
            </div>
            <div style={{ fontSize: 13, color: S.onSurfaceMuted }}>
              {firebaseUser?.email} — used as your contact email going forward
            </div>
          </div>
        </div>
      </Card>

      <Card padding={24} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <FieldReconciler
          label="First name"
          existing={existingFirst}
          sso={ssoFirst}
          choice={first.choice}
          edited={first.edited}
          onChange={setFirst}
        />
        <FieldReconciler
          label="Last name"
          existing={existingLast}
          sso={ssoLast}
          choice={last.choice}
          edited={last.edited}
          onChange={setLast}
        />
        <FieldReconciler
          label="Phone"
          existing={existingPhone}
          sso={null}
          choice={phone.choice}
          edited={phone.edited}
          onChange={setPhone}
          hint="Google doesn't share phone — keep existing or write your own."
        />
        <FieldReconciler
          label="Address"
          existing={existingAddress}
          sso={null}
          choice={address.choice}
          edited={address.edited}
          onChange={setAddress}
          hint="Google doesn't share address — keep existing or write your own."
        />
      </Card>

      {error && <p style={{ margin: "16px 0 0", fontSize: 13, color: S.error }}>{error}</p>}

      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleContinue}
          disabled={!canSubmit || isPending}
        >
          {isPending ? "Saving…" : "Save & continue"}
        </Button>
      </div>
      <p style={{ margin: "16px 0 0", fontSize: 12, color: S.onSurfaceMuted }}>
        You can change these any time from your profile.
      </p>
    </Shell>
  );
}

const Shell = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: S.surfaceContainerLow,
        padding: "48px 24px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 560 }}>
        <div style={{ marginBottom: 32 }}>
          <Wordmark />
        </div>
        {children}
      </div>
    </div>
  );
}
