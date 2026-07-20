import "server-only";
import type { Vertical } from "./verticals";

/**
 * 3층 repair loop(spec/README.md 7장, generate-content.ts의 ContentGenerationFailedError)가
 * 최종 실패했을 때만 호출된다. 사장님에게는 절대 원인을 노출하지 않고(호출부가
 * 일반화된 메시지로 대체), 여기서만 로그+관리자 알림을 남긴다.
 *
 * Slack 등 실제 알림 채널이 아직 이 프로젝트에 연결돼 있지 않아서,
 * ADMIN_ALERT_WEBHOOK_URL이 설정된 경우에만 웹훅으로 보내고, 없으면 구조화된
 * 콘솔 로그(Vercel 로그 대시보드에서 검색 가능)로만 남긴다 — 웹훅 URL이 생기면
 * env var만 추가하면 되고 이 파일은 안 건드려도 된다.
 */
export async function notifyAdminOfGenerationFailure(details: {
  vertical: Vertical;
  businessName?: string;
  error: unknown;
}): Promise<void> {
  const message = details.error instanceof Error ? details.error.message : String(details.error);

  console.error("[admin-alert] 콘텐츠 생성 최종 실패", {
    vertical: details.vertical,
    businessName: details.businessName,
    error: message,
    timestamp: new Date().toISOString(),
  });

  const webhookUrl = process.env.ADMIN_ALERT_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `[cornerpage] 콘텐츠 생성 최종 실패 (vertical=${details.vertical}${
          details.businessName ? `, business=${details.businessName}` : ""
        })\n${message}`,
      }),
    });
  } catch (err) {
    // 알림 발송 실패가 본 요청 흐름을 막으면 안 된다 — 로그만 남긴다.
    console.error("[admin-alert] 웹훅 전송 실패:", err);
  }
}
