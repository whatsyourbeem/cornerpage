import type { MiniHomepageContent } from "@/lib/content-types";
import { LAYOUT_ORDER, TONE_SLUG, resolveBrandCssVars } from "@/lib/tone";
import { Topbar } from "./blocks/Topbar";
import { Hero } from "./blocks/Hero";
import { TrustStrip } from "./blocks/TrustStrip";
import { About } from "./blocks/About";
import { Menu } from "./blocks/Menu";
import { Gallery } from "./blocks/Gallery";
import { Reviews } from "./blocks/Reviews";
import { Info } from "./blocks/Info";
import { StickyCta } from "./blocks/StickyCta";
import { HowItWorks } from "./blocks/HowItWorks";
import { Faq } from "./blocks/Faq";

export function MiniHomepageSite({ content }: { content: MiniHomepageContent }) {
  const { meta, blocks } = content;
  const toneSlug = TONE_SLUG[meta.axis_a_tone];
  const order = LAYOUT_ORDER[meta.axis_b_layout];
  const brandCssVars = resolveBrandCssVars(meta);

  const renderBlock = (key: string) => {
    switch (key) {
      case "hero":
        return <Hero hero={blocks.hero} info={blocks.info} toneSlug={toneSlug} key={key} />;
      case "trust_strip":
        return (
          <TrustStrip trustStrip={blocks.trust_strip} toneSlug={toneSlug} key={key} />
        );
      case "about":
        return blocks.about ? <About about={blocks.about} key={key} /> : null;
      case "menu":
        return <Menu menu={blocks.menu} info={blocks.info} key={key} />;
      case "gallery":
        return blocks.gallery ? (
          <Gallery gallery={blocks.gallery} key={key} />
        ) : null;
      case "reviews":
        return blocks.reviews ? (
          <Reviews reviews={blocks.reviews} key={key} />
        ) : null;
      case "how_it_works":
        return blocks.how_it_works ? (
          <HowItWorks howItWorks={blocks.how_it_works} key={key} />
        ) : null;
      case "faq":
        return blocks.faq ? <Faq faq={blocks.faq} key={key} /> : null;
      case "info":
        return <Info info={blocks.info} key={key} />;
      default:
        return null;
    }
  };

  return (
    <div
      className="mhp-page"
      data-tone={toneSlug}
      style={brandCssVars as React.CSSProperties}
    >
      <Topbar topbar={blocks.topbar} logoUrl={meta.logo_url} info={blocks.info} />
      <main>{order.map(renderBlock)}</main>
      <StickyCta stickyCta={blocks.sticky_cta} />
    </div>
  );
}
