import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">InterviewOS</h1>
      <p className="max-w-md text-lg text-muted-foreground">
        Coding challenges, peer mock interviews, and resume reviews, all in
        one place.
      </p>
      <Button>Get started</Button>
    </main>
  );
}
