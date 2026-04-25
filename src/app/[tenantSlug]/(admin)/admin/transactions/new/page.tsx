"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { openModal } from "@/lib/modals/store";

// Deep-link convenience: navigating here opens the record-gift modal
// over the transactions list. Useful for "Record gift" buttons that
// aren't bound to the modal store directly (e.g. emails, sidebars).
export default function NewTransactionPage() {
  const router = useRouter();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();

  useEffect(() => {
    router.replace(`/${tenantSlug}/admin/transactions`);
    openModal("record-gift", { tenantSlug });
  }, [router, tenantSlug]);

  return null;
}
