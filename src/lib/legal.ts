/**
 * 모든 vertical 공용 이용약관·개인정보처리방침 템플릿. {{변수}} 자리에 콘텐츠 JSON 값만
 * 채운다 — LLM 호출 없음, 토큰 비용 0. 업종 특화 문구(예: "스튜디오", "프로그램") 없이
 * 중립적인 표현만 사용해 어떤 vertical이 추가되어도 그대로 재사용한다.
 *
 * 이 사이트들은 자체 폼으로 개인정보를 수집하지 않고 전화·카카오톡·인스타그램 등 외부
 * 채널로 연결만 하므로(InquiryDialog·CTA는 전부 outbound link), 방침도 그 사실만 반영한다.
 * 실제 상담 과정에서 오가는 정보는 각 외부 채널의 정책이 적용되는 영역이라 여기서 다루지 않는다.
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

export interface LegalBusinessInfo {
  registered_name: string;
  ceo_name: string;
  registration_number: string;
}

export interface LegalInfo {
  address: string;
  phone: string;
  business_info: LegalBusinessInfo | null;
}

export interface LegalMeta {
  business_name: string;
}

export function buildLegalDocuments(content: { meta: LegalMeta; info: LegalInfo }): {
  terms: LegalDocument;
  privacy: LegalDocument;
} {
  const businessName = content.meta.business_name;
  const { phone, address, business_info } = content.info;

  const terms: LegalDocument = {
    title: "이용약관",
    sections: [
      {
        heading: "제1조 (목적)",
        body: `이 약관은 ${businessName}이(가) 운영하는 웹사이트를 통해 제공하는 정보 제공 및 문의 연결 서비스 이용과 관련하여 운영자와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.`,
      },
      {
        heading: "제2조 (서비스의 내용)",
        body: "웹사이트는 다음 서비스를 제공합니다.\n1. 업체 소개 및 상품·서비스 정보 제공\n2. 전화, 카카오톡, 인스타그램 등 외부 채널을 통한 문의 연결",
      },
      {
        heading: "제3조 (문의의 성격)",
        body: "웹사이트를 통한 문의 연결은 정식 계약이나 예약의 확정을 의미하지 않으며, 실제 상담·예약·결제 등은 연결된 외부 채널에서 별도로 진행됩니다.",
      },
      {
        heading: "제4조 (책임의 한계)",
        body: "운영자는 웹사이트에 게재된 정보의 정확성을 위해 노력하나, 상품·서비스 내용·가격·운영시간 등은 사전 고지 없이 변경될 수 있습니다.",
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
      heading: "1. 개인정보의 직접 수집 여부",
      body: "이 웹사이트는 회원가입이나 별도의 정보 입력 절차 없이 운영되며, 웹사이트 자체는 이용자로부터 개인정보를 수집하지 않습니다.",
    },
    {
      heading: "2. 외부 채널 연결 시 유의사항",
      body: "전화, 카카오톡, 인스타그램 등 웹사이트에 안내된 외부 채널로 연결되어 발생하는 문의·상담 과정의 정보는 각 채널(카카오, 인스타그램 등) 운영사의 개인정보처리방침이 적용됩니다.",
    },
    {
      heading: "3. 쿠키 및 방문자 추적",
      body: "이 웹사이트는 별도의 방문자 추적 도구(쿠키·분석 도구 등)를 사용하지 않습니다.",
    },
    {
      heading: "4. 개인정보 보호책임자",
      body: responsibleLine,
    },
  ];

  if (business_info) {
    privacySections.push({
      heading: "5. 사업자 정보",
      body: `상호명: ${business_info.registered_name}\n대표자: ${business_info.ceo_name}\n사업자등록번호: ${business_info.registration_number}`,
    });
  }

  const privacy: LegalDocument = {
    title: "개인정보처리방침",
    intro: `${businessName}(이하 "운영자")은 이용자의 개인정보를 중요시하며, 다음과 같이 개인정보를 처리합니다.`,
    sections: privacySections,
  };

  return { terms, privacy };
}
