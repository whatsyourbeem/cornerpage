import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { SiteRow } from "@/lib/sites";
import { LogoutButton } from "./LogoutButton";

const MAX_SITES_PER_ACCOUNT = 3;

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const { data: sites } = await supabase
    .from("sites")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });

  const mySites = (sites ?? []) as SiteRow[];

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "40px 20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>마이페이지</h1>
        <LogoutButton />
      </div>

      <p style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>
        {user.email}
      </p>
      <p style={{ fontSize: 13, color: "#999", marginBottom: 24 }}>
        내 홈페이지 {mySites.length}/{MAX_SITES_PER_ACCOUNT}개 사용 중
      </p>

      <ul style={{ display: "flex", flexDirection: "column", gap: 10, listStyle: "none", padding: 0, margin: 0 }}>
        {mySites.map((site) => (
          <li key={site.id}>
            <Link
              href={`/preview/${site.slug}`}
              style={{
                display: "block",
                padding: "14px 16px",
                border: "1px solid #ddd",
                borderRadius: 10,
                textDecoration: "none",
                color: "#111",
              }}
            >
              <strong>{site.business_name}</strong>
            </Link>
          </li>
        ))}
      </ul>

      {mySites.length === 0 && (
        <p style={{ fontSize: 13, color: "#999" }}>아직 만든 홈페이지가 없어요.</p>
      )}

      {mySites.length < MAX_SITES_PER_ACCOUNT && (
        <Link
          href="/create"
          style={{
            display: "block",
            marginTop: 20,
            padding: "14px 16px",
            borderRadius: 10,
            background: "#111",
            color: "white",
            textAlign: "center",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          새 홈페이지 만들기
        </Link>
      )}
    </main>
  );
}
