#!/usr/bin/env python3
"""
required-but-nullable 필드 감사 스크립트.

content.schema.json에서 "값은 null 허용이지만 키 자체는 required인 필드"를 전부 찾아낸다.
이런 필드는 schema-summary.md(LLM이 실제로 읽는 프롬프트 문서)에 "required key"라고
명시하지 않으면, LLM이 "값이 없으니 키도 생략해도 되겠지"로 잘못 판단해 ajv 검증에
실패하는 사고로 이어진다(실제 발생 사례: 2026-07-18, boutique-fitness의
info.hours.structured[].break·last_order 누락).

사용법:
    python3 tools/audit_required_nullable.py for-frontend/boutique-fitness/content.schema.json
    python3 tools/audit_required_nullable.py for-frontend/general/content.schema.json

새 필드를 추가하거나 스키마를 고칠 때마다 재실행해서, 여기 나온 필드가 전부
schema-summary.md에 "required key"라고 표시돼 있는지 사람이 대조해야 한다
(자동 대조는 Claude Code 쪽 build-skill-prompt.ts 파이프라인의 lint 단계로 예정 —
spec/README.md 7장 "2층" 항목 참고).
"""
import json
import sys


def find_required_nullable_fields(schema_path: str) -> list[str]:
    schema = json.load(open(schema_path, encoding="utf-8"))
    defs = schema.get("$defs", {})
    found = []
    for name, definition in defs.items():
        if not isinstance(definition, dict) or definition.get("type") != "object":
            continue
        required = set(definition.get("required", []))
        properties = definition.get("properties", {})
        for prop, prop_schema in properties.items():
            if prop not in required:
                continue
            is_nullable = json.dumps(prop_schema).count('"null"') > 0
            if is_nullable:
                found.append(f"{name}.{prop}")
    return found


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("사용법: python3 audit_required_nullable.py <content.schema.json 경로>")
        sys.exit(1)

    fields = find_required_nullable_fields(sys.argv[1])
    print(f"=== {sys.argv[1]}: required-but-nullable 필드 {len(fields)}개 ===")
    for f in fields:
        print(f"  {f}")
    print()
    print("이 필드들이 schema-summary.md에 'required key'로 명시돼 있는지 확인하세요.")
