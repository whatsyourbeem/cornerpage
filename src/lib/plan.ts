/**
 * sites.plan/plan_expires_at 게이팅 로직. 결제는 계정이 아니라 사이트 단위라
 * profiles가 아닌 각 site row를 인자로 받는다. 대시보드(표시)·API(권한 체크)
 * 양쪽에서 쓴다.
 */
export interface PlanInfo {
  plan: string;
  plan_expires_at: string | null;
}

export function isProPlan(site: PlanInfo | null | undefined): boolean {
  if (!site) return false;
  return site.plan === "pro" && (!site.plan_expires_at || new Date(site.plan_expires_at) > new Date());
}
