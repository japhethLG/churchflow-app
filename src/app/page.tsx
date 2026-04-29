import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/server";

// Landing redirect per SPECS §11.5. The URL (/[slug]/…) is the source of
// truth for which tenant a request targets, so `/` just decides *where*
// to send the user based on their session.
export default async () => {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (user.isSuperAdmin) {
    redirect("/super-admin/tenants");
  }

  const memberships = Object.entries(user.tenantMemberships);

  if (memberships.length === 0) {
    // Signed in but not a member of any tenant yet — waiting on an
    // invitation. /select-church renders the "no memberships" state.
    redirect("/select-church");
  }

  if (memberships.length > 1) {
    redirect("/select-church");
  }

  const [slug, membership] = memberships[0]!;
  redirect(
    membership.role === "ADMIN"
      ? `/${slug}/admin/dashboard`
      : `/${slug}/member/dashboard`,
  );
};
