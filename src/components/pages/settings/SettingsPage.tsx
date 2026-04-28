"use client";

import { useState, useEffect } from "react";
import {
  PageHeader,
  Button,
  Input,
  Card,
  SectionTitle,
  Select,
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

export const SettingsPage = ({ tenantSlug }: { tenantSlug: string }) => {
  const tenantQ = useTenant(tenantSlug);
  const tenant = tenantQ.data;
  const updateTenant = useUpdateTenant();

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
  };

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
  };

  if (tenantQ.isLoading) {
    return (
      <div>
        <PageHeader
          overline="Configuration"
          title="Settings."
          subtitle="Loading..."
        />
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <div className="mb-5 h-4 w-40 animate-pulse rounded bg-secondary" />
              <div className="mb-3 h-11 animate-pulse rounded-lg bg-secondary" />
              <div className="h-11 animate-pulse rounded-lg bg-secondary" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <PageHeader
        overline="Configuration"
        title="Settings"
        subtitle="Manage your church profile, currency, and fiscal year."
        action={
          <div className="mr-2.5 flex items-center gap-2.5">
            {saved && (
              <span className="text-sm font-medium text-success">✓ Saved</span>
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
        <div className="mb-4 rounded-[10px] bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex max-w-[720px] flex-col gap-5">
        <Card>
          <SectionTitle title="Church profile" />
          <div className="flex flex-col gap-4">
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

        <Card>
          <SectionTitle title="Financial settings" />
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Currency"
                value={currency}
                onChange={(v) => {
                  setCurrency(v);
                  markDirty();
                }}
                options={[
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
                ].map((c) => ({ value: c, label: c }))}
              />

              <Select
                label="Fiscal year starts"
                value={String(fiscalYearStart)}
                onChange={(v) => {
                  setFiscalYearStart(Number(v));
                  markDirty();
                }}
                options={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))}
              />
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle title="Timezone" />
          <Select
            label="IANA Timezone"
            value={timezone}
            onChange={(v) => {
              setTimezone(v);
              markDirty();
            }}
            options={TIMEZONES.map((tz) => ({
              value: tz,
              label: tz.replace(/_/g, " "),
            }))}
            hint="Used for transaction date bucketing and fiscal year calculations."
          />
        </Card>

        <Card>
          <SectionTitle title="Identifiers" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                Slug
              </label>
              <div className="rounded-[10px] bg-muted px-3.5 py-2.5 font-mono text-sm text-muted-foreground">
                {tenant?.slug ?? tenantSlug}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Only super-admins can change this.
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                Tenant ID
              </label>
              <div className="truncate overflow-hidden rounded-[10px] bg-muted px-3.5 py-2.5 font-mono text-sm text-muted-foreground">
                {tenant?.id ?? "—"}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
