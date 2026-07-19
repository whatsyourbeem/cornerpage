import type { MiniHomepageContent } from "@/lib/content-types-boutique-fitness";
import { buildLayoutOrder, resolveBrandCssVars } from "@/lib/tone-boutique-fitness";
import { InquiryDialogProvider } from "./DialogContext";
import { InquiryDialog } from "./InquiryDialog";
import { Topbar } from "./blocks/Topbar";
import { Hero } from "./blocks/Hero";
import { TrustStrip } from "./blocks/TrustStrip";
import { Transformations } from "./blocks/Transformations";
import { Reviews } from "./blocks/Reviews";
import { Professionals } from "./blocks/Professionals";
import { Philosophy } from "./blocks/Philosophy";
import { Atmosphere } from "./blocks/Atmosphere";
import { Gallery } from "./blocks/Gallery";
import { Facility } from "./blocks/Facility";
import { Menu } from "./blocks/Menu";
import { Info } from "./blocks/Info";
import { StickyCta } from "./blocks/StickyCta";
import { HowItWorks } from "./blocks/HowItWorks";
import { Faq } from "./blocks/Faq";

export function BoutiqueFitnessSite({ content }: { content: MiniHomepageContent }) {
  const { meta, blocks } = content;
  const order = buildLayoutOrder(meta.lead_emphasis);
  const brandCssVars = resolveBrandCssVars(meta);

  const renderBlock = (key: string) => {
    switch (key) {
      case "hero":
        return <Hero hero={blocks.hero} browseChannels={meta.browse_channels} key={key} />;
      case "trust_strip":
        return <TrustStrip trustStrip={blocks.trust_strip} key={key} />;
      case "transformations":
        return blocks.transformations ? (
          <Transformations transformations={blocks.transformations} key={key} />
        ) : null;
      case "reviews":
        return blocks.reviews ? <Reviews reviews={blocks.reviews} key={key} /> : null;
      case "professionals":
        return <Professionals professionals={blocks.professionals} key={key} />;
      case "philosophy":
        return blocks.philosophy ? <Philosophy philosophy={blocks.philosophy} key={key} /> : null;
      case "atmosphere":
        return blocks.atmosphere ? <Atmosphere atmosphere={blocks.atmosphere} key={key} /> : null;
      case "gallery":
        return blocks.gallery ? <Gallery gallery={blocks.gallery} key={key} /> : null;
      case "facility":
        return blocks.facility ? <Facility facility={blocks.facility} key={key} /> : null;
      case "menu":
        return <Menu menu={blocks.menu} info={blocks.info} key={key} />;
      case "info":
        return <Info info={blocks.info} key={key} />;
      case "how_it_works":
        return blocks.how_it_works ? <HowItWorks howItWorks={blocks.how_it_works} key={key} /> : null;
      case "faq":
        return blocks.faq ? <Faq faq={blocks.faq} key={key} /> : null;
      default:
        return null;
    }
  };

  return (
    <InquiryDialogProvider>
      <div className="mhp-page" data-tone="grounded" style={brandCssVars as React.CSSProperties}>
        <Topbar topbar={blocks.topbar} logoUrl={meta.logo_url} />
        <main>{order.map(renderBlock)}</main>
        <StickyCta stickyCta={blocks.sticky_cta} />
        <InquiryDialog channels={meta.inquiry_channels} />
      </div>
    </InquiryDialogProvider>
  );
}
