/** profiles.plan/plan_expires_at 게이팅 로직. 대시보드(표시)·API(권한 체크) 양쪽에서 쓴다. */
export interface PlanInfo {
  plan: string;
  plan_expires_at: string | null;
}

export function isProPlan(profile: PlanInfo | null | undefined): boolean {
  if (!profile) return false;
  return profile.plan === "pro" && (!profile.plan_expires_at || new Date(profile.plan_expires_at) > new Date());
}
