"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { Button, Input } from "@/components/primitives";
import { useCreateTenant, useSlugSuggestion } from "@/lib/api/tenants";
import { useIssueInvitation } from "@/lib/api/invitations";

type Step = 1 | 2 | 3;

type Draft = {
  name: string;
  slug: string;
  description: string;
};

const Stepper = ({ step }: { step: Step }) => {
  const steps = ["Details", "Invite admins", "Done"];
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 32 }}>
      {steps.map((label, i) => {
        const idx = (i + 1) as Step;
        const isActive = idx === step;
        const isDone = idx < step;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div
              style={{
                padding: "6px 16px",
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 600,
                background: isActive ? S.primaryFixed : isDone ? S.surfaceContainerHigh : S.surfaceContainer,
                color: isActive ? S.primary : isDone ? S.onSurface : S.onSurfaceMuted,
              }}
            >
              {isDone ? "✓ " : ""}{label}
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 24, height: 1, background: S.outlineVariant }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

const Step1Details = ({
  draft,
  setDraft,
  onNext,
  onCancel,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  onNext: () => void;
  onCancel: () => void;
}) => {
  const { data: suggestion } = useSlugSuggestion(draft.name, draft.name.length >= 3 && !draft.slug);
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    if (!slugEdited && suggestion?.slug) {
      setDraft({ ...draft, slug: suggestion.slug });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestion?.slug, slugEdited]);

  return (
    <>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: S.onSurfaceMuted, marginBottom: 4 }}>
          Platform
        </div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }}>New church.</h1>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: S.onSurfaceVariant }}>Set up the church profile. You&apos;ll invite admins in the next step.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 32 }}>
        <Input
          label="Church name"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="Grace Community Church"
        />
        <div>
          <Input
            label="Slug"
            value={draft.slug}
            onChange={(e) => {
              setSlugEdited(true);
              setDraft({ ...draft, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") });
            }}
            placeholder="grace-community"
          />
          {draft.slug && (
            <div style={{ fontSize: 11, color: S.onSurfaceMuted, marginTop: 4 }}>
              URL: /{draft.slug}/admin/dashboard
            </div>
          )}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: S.onSurfaceVariant, marginBottom: 8 }}>
            Description <span style={{ fontWeight: 400, color: S.onSurfaceMuted }}>(optional)</span>
          </div>
          <textarea
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            rows={3}
            placeholder="Brief description of this church…"
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: S.radiusMd,
              border: `1.5px solid ${S.outlineVariant}`,
              fontSize: 14,
              fontFamily: "inherit",
              color: S.onSurface,
              background: S.surfaceContainerLow,
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
        <Button variant="tertiary" onClick={onCancel}>Cancel</Button>
        <Button
          variant="primary"
          onClick={onNext}
          disabled={!draft.name.trim() || !draft.slug.trim()}
        >
          Next: Invite admins →
        </Button>
      </div>
    </>
  );
}

const Step2Invites = ({
  tenantId,
  tenantName,
  onNext,
  onBack,
}: {
  tenantId: string;
  tenantName: string;
  onNext: (invitesSent: number) => void;
  onBack: () => void;
}) => {
  const [emails, setEmails] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const { mutateAsync: sendInvite } = useIssueInvitation();

  const addEmail = () => {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed || emails.includes(trimmed)) { setInput(""); return; }
    setEmails((prev) => [...prev, trimmed]);
    setInput("");
  }

  const removeEmail = (email: string) => {
    setEmails((prev) => prev.filter((e) => e !== email));
    setErrors((prev) => { const n = { ...prev }; delete n[email]; return n; });
  }

  const handleSend = async () => {
    setSending(true);
    const results: Record<string, string> = {};
    for (const email of emails) {
      try {
        await sendInvite({ params: { path: { tenantId } }, body: { email, role: "ADMIN" } });
      } catch (err) {
        results[email] = err instanceof Error ? err.message : "Failed";
      }
    }
    setErrors(results);
    setSending(false);
    const succeeded = emails.filter((e) => !results[e]).length;
    onNext(succeeded);
  }

  return (
    <>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: S.onSurfaceMuted, marginBottom: 4 }}>
          {tenantName}
        </div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }}>Invite admins.</h1>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: S.onSurfaceVariant }}>
          Optional. Invite the first admins now, or do it later from the church page.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 32 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="email"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addEmail(); } }}
            placeholder="admin@example.com"
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: S.radiusMd,
              border: `1.5px solid ${S.outlineVariant}`,
              fontSize: 14,
              fontFamily: "inherit",
              background: S.surfaceContainerLow,
              color: S.onSurface,
            }}
          />
          <Button variant="secondary" onClick={addEmail} disabled={!input.trim()}>Add</Button>
        </div>

        {emails.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {emails.map((email) => (
              <div
                key={email}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 9999,
                  background: errors[email] ? S.errorContainer : S.surfaceContainerHigh,
                  fontSize: 13,
                  color: errors[email] ? S.error : S.onSurface,
                }}
              >
                {email}
                {errors[email] && <span style={{ fontSize: 11 }}>({errors[email]})</span>}
                <button
                  onClick={() => removeEmail(email)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0, marginLeft: 2 }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
        <Button variant="tertiary" onClick={onBack} disabled={sending}>← Back</Button>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" onClick={() => onNext(0)} disabled={sending}>
            Skip
          </Button>
          {emails.length > 0 && (
            <Button variant="primary" onClick={handleSend} disabled={sending}>
              {sending ? "Sending…" : `Send ${emails.length} invite${emails.length !== 1 ? "s" : ""}`}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

const Step3Success = ({
  tenantName,
  tenantSlug,
  invitesSent,
}: {
  tenantName: string;
  tenantSlug: string;
  invitesSent: number;
}) => {
  const router = useRouter();
  return (
    <div style={{ textAlign: "center", padding: "24px 0" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
      <h2 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }}>
        {tenantName} created.
      </h2>
      {invitesSent > 0 && (
        <p style={{ margin: "12px 0 0", fontSize: 14, color: S.onSurfaceVariant }}>
          {invitesSent} admin invite{invitesSent !== 1 ? "s" : ""} sent.
        </p>
      )}
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 32 }}>
        <Button variant="secondary" onClick={() => router.push("/super-admin/tenants")}>
          Back to churches
        </Button>
        <Button variant="primary" onClick={() => router.push(`/super-admin/tenants/${tenantSlug}`)}>
          Go to {tenantName} →
        </Button>
      </div>
    </div>
  );
}

export default () => {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [draft, setDraft] = useState<Draft>({ name: "", slug: "", description: "" });
  const [createdTenant, setCreatedTenant] = useState<{ id: string; slug: string } | null>(null);
  const [invitesSent, setInvitesSent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync: createTenant, isPending: creating } = useCreateTenant();

  const handleStep1Next = async () => {
    setError(null);
    try {
      const t = await createTenant({
        params: {},
        body: { name: draft.name.trim(), slug: draft.slug.trim() },
      });
      if (t) setCreatedTenant({ id: (t as { id: string }).id, slug: (t as { slug: string }).slug });
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create church");
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 24px" }}>
      <Stepper step={step} />

      {step === 1 && (
        <>
          <Step1Details
            draft={draft}
            setDraft={setDraft}
            onNext={handleStep1Next}
            onCancel={() => router.push("/super-admin/tenants")}
          />
          {creating && <p style={{ marginTop: 8, fontSize: 13, color: S.onSurfaceMuted }}>Creating…</p>}
          {error && <p style={{ marginTop: 8, fontSize: 13, color: S.error }}>{error}</p>}
        </>
      )}

      {step === 2 && createdTenant && (
        <Step2Invites
          tenantId={createdTenant.id}
          tenantName={draft.name}
          onNext={(sent) => { setInvitesSent(sent); setStep(3); }}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && createdTenant && (
        <Step3Success
          tenantName={draft.name}
          tenantSlug={createdTenant.slug}
          invitesSent={invitesSent}
        />
      )}
    </div>
  );
}
