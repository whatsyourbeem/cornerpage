import { readFileSync } from "fs";

/**
 * spec/tools/audit_required_nullable.py의 Node 포팅 — "값은 null 허용이지만 키 자체는
 * required인 필드"를 content.schema.json의 $defs에서 찾아낸다. 로직은 원본과 동일하게
 * 유지한다(파이썬 스크립트가 진실의 원천, 이건 빌드 파이프라인에 끼워 넣기 위한 이식본).
 */
export function findRequiredNullableFields(schema: unknown): string[] {
  const defs = (schema as { $defs?: Record<string, unknown> }).$defs ?? {};
  const found: string[] = [];

  for (const [name, definition] of Object.entries(defs)) {
    if (typeof definition !== "object" || definition === null) continue;
    const def = definition as {
      type?: string;
      required?: string[];
      properties?: Record<string, unknown>;
    };
    if (def.type !== "object") continue;

    const required = new Set(def.required ?? []);
    const properties = def.properties ?? {};
    for (const [prop, propSchema] of Object.entries(properties)) {
      if (!required.has(prop)) continue;
      const isNullable = JSON.stringify(propSchema).includes('"null"');
      if (isNullable) found.push(`${name}.${prop}`);
    }
  }

  return found;
}

/**
 * 2층(빌드 타임 lint, spec/README.md 7장): required-but-nullable 필드마다
 * schema-summary.md 안에 "필드명": ... required key 패턴(같은 줄)이 있는지 정규식으로
 * 대조한다. def 이름은 schema-summary.md가 평면화된 JSON 형태라 안 실려 있어서
 * 프로퍼티명만으로 매칭한다 — 같은 이름이 여러 def에 걸쳐 있으면 그중 하나만 라벨
 * 붙어 있어도 통과하는 느슨한 검사지만, 사람이 수동으로 대조하던 기준과 동일하다.
 */
export function findUnlabeledFields(schemaPath: string, summaryPath: string): string[] {
  const schema = JSON.parse(readFileSync(schemaPath, "utf-8"));
  const summary = readFileSync(summaryPath, "utf-8");
  const fields = findRequiredNullableFields(schema);

  return fields.filter((field) => {
    const prop = field.split(".").pop()!;
    const escaped = prop.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // 값(따옴표로 감싼 JSON 문자열)만 캡처해서 대조한다 — 단순히 "다음 줄바꿈까지"로
    // 자르면, 같은 줄에 여러 필드가 나열될 때 다른 필드의 "required key" 라벨을
    // 잘못 빌려오는 오탐이 생긴다(예: "logo_url": "...", "brand_color": "..., required key").
    // 이스케이프된 따옴표(\")를 감안해 값의 실제 닫는 따옴표까지만 잡는다.
    //
    // 같은 프로퍼티명이 서로 다른 def에 걸쳐 여러 번 등장할 수 있는데(예: general의
    // badge는 Hero.badge=required non-null과 MenuItem.badge=required-nullable 둘 다
    // 있음), 첫 매치만 보면 엉뚱한 def의(라벨이 필요 없는) occurrence에 걸려 오탐이
    // 난다 — 전체 occurrence 중 하나라도 라벨이 있으면 통과시킨다(사람이 하던 수동
    // 대조와 동일한 느슨한 기준).
    const pattern = new RegExp(`"${escaped}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`, "g");
    const matches = [...summary.matchAll(pattern)];
    return !matches.some((m) => m[1].includes("required key"));
  });
}
