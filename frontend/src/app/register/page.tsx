"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Middleware handles redirect if already logged in.
    // Otherwise, redirect to login page with register tab.
    router.replace("/login?tab=register");
  }, [router]);

  return null;
}
