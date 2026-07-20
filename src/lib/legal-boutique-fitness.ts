import type { MiniHomepageContent } from "./content-types-boutique-fitness";

/**
 * spec/for-frontend/boutique-fitness/legal-template.md의 고정 문구를 그대로 옮기고
 * {{변수}} 자리에 콘텐츠 JSON 값만 채운다 — LLM 호출 없음, 토큰 비용 0.
 * 조건부 문단({{business_info}} null 처리)은 여기서 분기로 처리한다.
 */
export interface LegalSection {
  heading: string;
  body: string;
}

export interface LegalDocument {
  title: string;
  intro?: string;
  sections: LegalSection[];
}

export function buildLegalDocuments(content: MiniHomepageContent): {
  terms: LegalDocument;
  privacy: LegalDocument;
} {
  const { meta, blocks } = content;
  const businessName = meta.business_name;
  const { phone, address, business_info } = blocks.info;

  const terms: LegalDocument = {
    title: "이용약관",
    sections: [
      {
        heading: "제1조 (목적)",
        body: `이 약관은 ${businessName}(이하 "스튜디오")이 운영하는 웹사이트를 통해 제공하는 상담·예약 문의 서비스 이용과 관련하여 스튜디오와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.`,
      },
      {
        heading: "제2조 (서비스의 내용)",
        body: "스튜디오는 웹사이트를 통해 다음 서비스를 제공합니다.\n1. 스튜디오 소개 및 프로그램 정보 제공\n2. 상담·예약 문의 접수",
      },
      {
        heading: "제3조 (문의의 성격)",
        body: "웹사이트를 통한 문의는 정식 계약이나 예약의 확정을 의미하지 않으며, 스튜디오와의 별도 상담을 통해 세부 사항이 확정됩니다.",
      },
      {
        heading: "제4조 (책임의 한계)",
        body: "스튜디오는 웹사이트에 게재된 정보의 정확성을 위해 노력하나, 프로그램 내용·가격·일정 등은 사전 고지 없이 변경될 수 있습니다.",
      },
      {
        heading: "제5조 (문의처)",
        body: `서비스 관련 문의: ${phone} / ${address}`,
      },
    ],
  };

  const responsibleLine = business_info
    ? `${business_info.ceo_name}(${businessName}) / 연락처: ${phone}`
    : `문의처: ${phone}`;

  const privacySections: LegalSection[] = [
    {
      heading: "1. 수집하는 개인정보 항목",
      body: "필수: 이름, 연락처\n선택: 상담 과정에서 제공하는 운동 목표, 신체 상태, 부상·질환 이력 등 건강에 관한 정보(민감정보) — 이 정보는 상담 응대 목적으로만 이용되며, 별도 동의 없이 제3자에게 제공되지 않습니다.",
    },
    {
      heading: "2. 개인정보의 수집 및 이용 목적",
      body: "상담·예약 문의 응대\n서비스 관련 안내",
    },
    {
      heading: "3. 개인정보의 보유 및 이용 기간",
      body: "문의 응대 목적 달성 후 지체 없이 파기합니다. 단, 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.",
    },
    {
      heading: "4. 개인정보의 제3자 제공",
      body: "스튜디오는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.",
    },
    {
      heading: "5. 개인정보 처리 위탁",
      body: "카카오톡·인스타그램 등 외부 플랫폼을 통한 문의는 각 플랫폼의 개인정보처리방침이 함께 적용됩니다.",
    },
    {
      heading: "6. 이용자의 권리",
      body: "이용자는 언제든지 자신의 개인정보에 대한 열람·정정·삭제를 요청할 수 있습니다.",
    },
    {
      heading: "7. 개인정보 보호책임자",
      body: responsibleLine,
    },
  ];

  if (business_info) {
    privacySections.push({
      heading: "8. 사업자 정보",
      body: `상호명: ${business_info.registered_name}\n대표자: ${business_info.ceo_name}\n사업자등록번호: ${business_info.registration_number}`,
    });
  }

  const privacy: LegalDocument = {
    title: "개인정보처리방침",
    intro: `${businessName}(이하 "스튜디오")은 이용자의 개인정보를 중요시하며, 다음과 같이 개인정보를 처리하고 있습니다.`,
    sections: privacySections,
  };

  return { terms, privacy };
}
