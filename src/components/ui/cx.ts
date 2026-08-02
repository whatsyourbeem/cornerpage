/** 조건부 className 결합용 최소 헬퍼. clsx 등 의존성을 새로 추가하지 않는다. */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
