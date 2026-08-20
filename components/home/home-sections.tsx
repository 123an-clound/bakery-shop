import { getFeaturedProducts, getBestSellerProducts } from "@/lib/bakery/catalog";
import type { ThemeData } from "@/lib/bakery/schemas";
import type { Locale } from "@/lib/bakery/types";

import { HeroSection } from "./hero-section";
import { CategoriesSection } from "./categories-section";
import { FeaturedProductsSection, BestSellersSection } from "./product-grid-section";
import { CustomCakeSection } from "./custom-cake-section";
import { StorySection } from "./story-section";
import { TestimonialsSection } from "./testimonials-section";
import { BlogSection } from "./blog-section";
import { InstagramSection } from "./instagram-section";
import { NewsletterSection } from "./newsletter-section";

/** Renders theme.sections in the admin-configured order, skipping disabled ones — muc 8.1. */
export async function HomeSections({ theme, locale }: { theme: ThemeData; locale: Locale }) {
  const sections = [...theme.sections].filter((s) => s.enabled).sort((a, b) => a.order - b.order);
  const enabledKeys = new Set(sections.map((s) => s.key));

  const featuredLimit = sections.find((s) => s.key === "featured")?.props?.limit;

  const [featured, bestSellers] = await Promise.all([
    enabledKeys.has("featured")
      ? getFeaturedProducts(typeof featuredLimit === "number" ? featuredLimit : 8)
      : Promise.resolve([]),
    enabledKeys.has("best_sellers") ? getBestSellerProducts(8) : Promise.resolve([]),
  ]);

  return (
    <>
      {sections.map((section) => {
        switch (section.key) {
          case "hero":
            return <HeroSection key="hero" hero={theme.hero} locale={locale} />;
          case "categories":
            return <CategoriesSection key="categories" locale={locale} />;
          case "featured":
            return <FeaturedProductsSection key="featured" products={featured} locale={locale} />;
          case "custom_cake":
            return <CustomCakeSection key="custom_cake" locale={locale} />;
          case "best_sellers":
            return <BestSellersSection key="best_sellers" products={bestSellers} locale={locale} />;
          case "story":
            return <StorySection key="story" locale={locale} />;
          case "testimonials":
            return <TestimonialsSection key="testimonials" locale={locale} />;
          case "blog":
            return <BlogSection key="blog" locale={locale} />;
          case "instagram":
            return <InstagramSection key="instagram" locale={locale} />;
          case "newsletter":
            return <NewsletterSection key="newsletter" />;
          default:
            return null;
        }
      })}
    </>
  );
}
