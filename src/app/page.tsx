import Link from "next/link";
import { ClipboardList, ImagePlus, Sparkles } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { MarketingButton, Panel } from "@/components/ui";

/**
 * 마케팅 서피스(docs/DESIGN.md toss.im 서피스 기준). CTA는 전부
 * MarketingButton(40/46px·r7)만 쓴다 — TDS product 버튼(56px·r16)은
 * 앱 내부(/create 위저드 등) 전용이라 여기 섞지 않는다(§7 Don't, §8).
 * 섹션 순서는 §10 "Value first, cost later"를 그대로 따른다: 결과물이
 * 어떻게 생기는지(가치)를 먼저 보여주고, 소요 시간·준비물(비용)은 그 다음에.
 */
export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-dvh flex-col bg-cp-canvas text-cp-fg">
      <header className="border-b border-cp-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-[13px] font-extrabold tracking-wide text-cp-muted">
            CORNERPAGE
          </Link>
          <Link href={user ? "/dashboard" : "/login"} className="text-[13px] font-semibold text-cp-body">
            {user ? "마이페이지" : "로그인"}
          </Link>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-5 py-20 text-center sm:py-28">
        <h1 className="text-cp-h1 font-bold text-cp-fg">
          질문에 답하기만 하면
          <br />
          내 가게 홈페이지가 만들어져요
        </h1>
        <p className="max-w-md text-cp-body text-cp-body">
          업종·메뉴·사진만 넣어주시면 나머지는 저희가 알아서 채워드려요.
        </p>
        <MarketingButton href="/create" variant="dark">
          내 홈페이지 만들기 →
        </MarketingButton>
      </section>

      <section className="bg-cp-surface">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
          <h2 className="text-cp-h3 font-bold text-cp-fg">이렇게 만들어져요</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Panel tone="outline" className="flex flex-col gap-3">
              <ClipboardList className="h-6 w-6 text-cp-primary" aria-hidden />
              <p className="text-[15px] font-bold text-cp-fg">1. 질문에 답하기</p>
              <p className="text-[13px] text-cp-body">업종·가게 이름·영업시간 같은 기본 정보만 입력해요.</p>
            </Panel>
            <Panel tone="outline" className="flex flex-col gap-3">
              <ImagePlus className="h-6 w-6 text-cp-primary" aria-hidden />
              <p className="text-[15px] font-bold text-cp-fg">2. 사진 몇 장 올리기</p>
              <p className="text-[13px] text-cp-body">대표 사진과 메뉴·시술 사진만 있으면 충분해요.</p>
            </Panel>
            <Panel tone="outline" className="flex flex-col gap-3">
              <Sparkles className="h-6 w-6 text-cp-primary" aria-hidden />
              <p className="text-[15px] font-bold text-cp-fg">3. 완성된 홈페이지 받기</p>
              <p className="text-[13px] text-cp-body">입력한 내용으로 나머지 문구·구성을 저희가 채워드려요.</p>
            </Panel>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-3xl px-5 py-16 sm:py-20">
          <h2 className="text-cp-h3 font-bold text-cp-fg">완성되면 이런 모습이에요</h2>
          <p className="mt-2 text-[14px] text-cp-body">대표 사진·메뉴·위치·후기까지, 손님이 궁금해할 정보를 한 페이지에 담아드려요.</p>
          <div className="mt-8 overflow-hidden rounded-cp-btn-lg border border-cp-border">
            <div className="flex items-center gap-1.5 border-b border-cp-border bg-cp-surface px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-cp-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-cp-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-cp-border" />
            </div>
            <div className="flex flex-col gap-3 bg-cp-canvas p-5">
              <div className="h-28 w-full rounded-cp-md bg-cp-surface" />
              <div className="h-4 w-2/3 rounded bg-cp-surface" />
              <div className="h-3 w-1/2 rounded bg-cp-surface" />
              <div className="mt-2 grid grid-cols-3 gap-2">
                <div className="h-16 rounded-cp-md bg-cp-surface" />
                <div className="h-16 rounded-cp-md bg-cp-surface" />
                <div className="h-16 rounded-cp-md bg-cp-surface" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cp-surface">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:py-20">
          <h2 className="text-cp-h3 font-bold text-cp-fg">필요한 건 이것뿐이에요</h2>
          <div className="mx-auto mt-6 flex max-w-sm flex-col gap-2 text-left text-[14px] text-cp-body">
            <p>✓ 약 3분이면 충분해요</p>
            <p>✓ 대표 사진 몇 장</p>
            <p>✓ 가게 이름·주소·전화번호·영업시간</p>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 text-center">
        <h2 className="text-cp-h3 font-bold text-cp-fg">지금 바로 시작해보세요</h2>
        <div className="mt-6">
          <MarketingButton href="/create" variant="dark">
            내 홈페이지 만들기 →
          </MarketingButton>
        </div>
      </section>

      <footer className="mt-auto border-t border-cp-border py-8 text-center text-[13px] text-cp-muted">
        © cornerpage
      </footer>
    </div>
  );
}
