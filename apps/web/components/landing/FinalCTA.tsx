import { Button } from "../ui/Button";
import Image from "next/image"

export function FinalCTA() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <div className="relative grid grid-cols-2  items-center justify-between gap-10 overflow-hidden rounded-none border border-border-strong bg-surface px-8 py-16 before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_500px_300px_at_90%_20%,rgba(176,108,225,0.22),transparent_60%)]">
        <div>
        <Image src="./cube.svg" alt="cube" width={566} height={508}/>

        </div>
        <div>
        <h2 className="relative font-display text-4xl font-bold sm:text-4xl mb-8 leading-[1.5] text-[#E5DBF1]">
            Start watching
            <br />
            in seconds.
          </h2>
        <div className="relative flex flex-wrap gap-3.5">
        
            <Button href="#" >Connect Wallet →</Button>
            <Button href="#" variant="ghost">
              Read the docs
            </Button>
          </div>
        </div>
        
        </div>
      </div>
    </section>
  );
}