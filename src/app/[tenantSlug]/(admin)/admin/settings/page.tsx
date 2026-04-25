"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { SANCTUARY as S } from "@/lib/design/tokens";
import {
  PageHeader,
  Button,
  Input,
  Card,
  SectionTitle,
} from "@/components/primitives";
import { useTenant, useUpdateTenant } from "@/lib/api/tenants";
import { nstr } from "@/lib/api/coerce";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Africa/Lagos",
  "Africa/Nairobi",
  "Africa/Johannesburg",
  "Asia/Kolkata",
  "Asia/Seoul",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
  "UTC",
];

export default () => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const tenantQ = useTenant(tenantSlug);
  const tenant = tenantQ.data;
  const updateTenant = useUpdateTenant();

  // Form state
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [timezone, setTimezone] = useState("UTC");
  const [fiscalYearStart, setFiscalYearStart] = useState(1);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form from tenant data
  useEffect(() => {
    if (!tenant) return;
    setName(tenant.name);
    setAddress(nstr(tenant.address) ?? "");
    setPhone(nstr(tenant.phone) ?? "");
    setEmail(nstr(tenant.email) ?? "");
    setCurrency(tenant.currency);
    setTimezone(tenant.timezone);
    setFiscalYearStart(tenant.fiscalYearStart);
    setDirty(false);
  }, [tenant]);

  const markDirty = () => {
    setDirty(true);
    setSaved(false);
  }

  const handleSave = async () => {
    if (!tenant) return;
    setError(null);
    try {
      await updateTenant.mutateAsync({
        params: { path: { tenantId: tenantSlug } },
        body: {
          name: name.trim(),
          address: address.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          currency,
          timezone,
          fiscalYearStart,
        },
      });
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  }

  if (tenantQ.isLoading) {
    return (
      <div>
        <PageHeader
          overline="Configuration"
          title="Settings."
          subtitle="Loading..."
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <div
                style={{
                  height: 16,
                  width: 160,
                  background: S.surfaceContainer,
                  borderRadius: 4,
                  marginBottom: 20,
                }}
              />
              <div
                style={{
                  height: 44,
                  background: S.surfaceContainer,
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              />
              <div
                style={{
                  height: 44,
                  background: S.surfaceContainer,
                  borderRadius: 8,
                }}
              />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      <PageHeader
        overline="Configuration"
        title="Settings"
        subtitle="Manage your church profile, currency, and fiscal year."
        action={
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              marginRight: 10,
            }}
          >
            {saved && (
              <span style={{ fontSize: 13, color: S.success, fontWeight: 500 }}>
                ✓ Saved
              </span>
            )}
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!dirty || updateTenant.isPending}
            >
              {updateTenant.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        }
      />

      {error && (
        <div
          style={{
            background: `${S.error}14`,
            color: S.error,
            padding: "12px 16px",
            borderRadius: 10,
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          maxWidth: 720,
        }}
      >
        {/* Church profile */}
        <Card>
          <SectionTitle title="Church profile" />
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Input
              label="Church name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                markDirty();
              }}
              placeholder="Grace Community Church"
            />
            <Input
              label="Address"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                markDirty();
              }}
              placeholder="123 Main St, Anytown, CA"
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <Input
                label="Phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  markDirty();
                }}
                placeholder="+1 555-555-0123"
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  markDirty();
                }}
                placeholder="office@example.com"
              />
            </div>
          </div>
        </Card>

        {/* Financial */}
        <Card>
          <SectionTitle title="Financial settings" />
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              {/* Currency */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: S.onSurfaceMuted,
                    marginBottom: 6,
                  }}
                >
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => {
                    setCurrency(e.target.value);
                    markDirty();
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: `1px solid ${S.surfaceContainerHigh}`,
                    background: S.surfaceContainerLowest,
                    color: S.onSurface,
                    fontSize: 14,
                    fontFamily: "inherit",
                    outline: "none",
                    appearance: "none",
                    cursor: "pointer",
                  }}
                >
                  {[
                    "USD",
                    "EUR",
                    "GBP",
                    "NGN",
                    "KES",
                    "ZAR",
                    "GHS",
                    "CAD",
                    "AUD",
                    "INR",
                    "BRL",
                    "KRW",
                  ].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fiscal Year Start */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: S.onSurfaceMuted,
                    marginBottom: 6,
                  }}
                >
                  Fiscal year starts
                </label>
                <select
                  value={fiscalYearStart}
                  onChange={(e) => {
                    setFiscalYearStart(Number(e.target.value));
                    markDirty();
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: `1px solid ${S.surfaceContainerHigh}`,
                    background: S.surfaceContainerLowest,
                    color: S.onSurface,
                    fontSize: 14,
                    fontFamily: "inherit",
                    outline: "none",
                    appearance: "none",
                    cursor: "pointer",
                  }}
                >
                  {MONTHS.map((m, i) => (
                    <option key={i + 1} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Timezone */}
        <Card>
          <SectionTitle title="Timezone" />
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: S.onSurfaceMuted,
                marginBottom: 6,
              }}
            >
              IANA Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => {
                setTimezone(e.target.value);
                markDirty();
              }}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                border: `1px solid ${S.surfaceContainerHigh}`,
                background: S.surfaceContainerLowest,
                color: S.onSurface,
                fontSize: 14,
                fontFamily: "inherit",
                outline: "none",
                appearance: "none",
                cursor: "pointer",
              }}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <p
              style={{
                fontSize: 12,
                color: S.onSurfaceMuted,
                marginTop: 6,
                lineHeight: 1.5,
              }}
            >
              Used for transaction date bucketing and fiscal year calculations.
            </p>
          </div>
        </Card>

        {/* Slug + Tenant ID (read-only) */}
        <Card>
          <SectionTitle title="Identifiers" />
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: S.onSurfaceMuted,
                  marginBottom: 6,
                }}
              >
                Slug
              </label>
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: S.surfaceContainerLow,
                  color: S.onSurfaceMuted,
                  fontSize: 14,
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                }}
              >
                {tenant?.slug ?? tenantSlug}
              </div>
              <p
                style={{ fontSize: 11, color: S.onSurfaceMuted, marginTop: 4 }}
              >
                Only super-admins can change this.
              </p>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: S.onSurfaceMuted,
                  marginBottom: 6,
                }}
              >
                Tenant ID
              </label>
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: S.surfaceContainerLow,
                  color: S.onSurfaceMuted,
                  fontSize: 14,
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {tenant?.id ?? "—"}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
