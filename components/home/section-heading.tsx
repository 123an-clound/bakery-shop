import { FadeIn } from "@/components/motion/fade-in";

/** Centered serif heading with a small gold eyebrow and hairline rule. */
export function SectionHeading({ eyebrow, title, id }: { eyebrow?: string; title: string; id?: string }) {
  return (
    <FadeIn>
      <div className="mb-12 text-center lg:mb-16">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2 id={id} className="font-heading mt-3 text-3xl font-medium text-balance sm:text-4xl lg:text-5xl">
          {title}
        </h2>
        <span aria-hidden="true" className="bg-primary mx-auto mt-6 block h-px w-16" />
      </div>
    </FadeIn>
  );
}
