import { ActivityTile, ChatsTile, HubsTile, LiveTile, VideoTile, VoiceTile } from "@/components/feature-tiles";
import { Container } from "@/components/container";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { cn } from "@/lib/utils";

/** One tile. Its fill, not a shared card style, is what tells the tiles apart. */
function Tile({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <article
      className={cn(
        "flex min-w-0 shrink-0 basis-[84%] snap-start flex-col rounded-3xl p-5 sm:basis-[56%] sm:rounded-[1.75rem] sm:p-6 md:basis-[42%] lg:basis-auto",
        className,
      )}
    >
      {children}
    </article>
  );
}

export function Features() {
  return (
    <section id="features" className="border-t border-line bg-canvas py-14 sm:py-20 lg:py-28">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="What is inside"
            title="Built for the crowd and the close circle."
            body="Communities with rooms for every topic, and private chats for everything else. Voice and video included."
          />
        </Reveal>
      </Container>

      {/* On a phone the tiles are a row to swipe, so the section stays one screen tall. From small screens up it is a grid. */}
      <Container className="mt-7 sm:mt-10 lg:mt-12">
        <div
          className={cn(
            "-mx-5 flex scroll-px-5 snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            "sm:-mx-8 sm:scroll-px-8 sm:gap-4 sm:px-8",
            "lg:mx-0 lg:grid lg:snap-none lg:grid-cols-6 lg:gap-5 lg:overflow-visible lg:px-0 lg:pb-0",
          )}
        >
          <Tile className="border border-line bg-surface lg:col-span-3 lg:min-h-[21rem]">
            <HubsTile />
          </Tile>
          <Tile className="bg-accent text-accent-ink lg:col-span-3 lg:min-h-[21rem]">
            <VoiceTile />
          </Tile>
          <Tile className="border border-line bg-raised lg:col-span-2 lg:min-h-[19rem]">
            <VideoTile />
          </Tile>
          <Tile className="bg-cream-card text-cream-ink lg:col-span-2 lg:min-h-[19rem]">
            <ChatsTile />
          </Tile>
          <Tile className="border border-line bg-surface lg:col-span-2 lg:min-h-[19rem]">
            <LiveTile />
          </Tile>
          <Tile className="border border-line bg-raised lg:col-span-6">
            <ActivityTile />
          </Tile>
        </div>
      </Container>
    </section>
  );
}
