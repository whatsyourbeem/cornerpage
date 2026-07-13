"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        padding: "8px 14px",
        borderRadius: 8,
        border: "1px solid #ddd",
        background: "white",
        color: "#666",
        fontWeight: 600,
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      로그아웃
    </button>
  );
}
