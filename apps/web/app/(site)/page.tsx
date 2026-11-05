import { Features } from "@/components/features";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { Waitlist } from "@/components/waitlist";

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <Waitlist />
    </>
  );
}
