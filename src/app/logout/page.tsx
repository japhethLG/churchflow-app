"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth/actions";

export default () => {
  const router = useRouter();

  useEffect(() => {
    signOut().then(() => router.push("/login"));
  }, [router]);

  return null;
}
