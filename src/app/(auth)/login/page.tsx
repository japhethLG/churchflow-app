import { Wordmark } from "@/components/primitives/Wordmark";
import { JournalIllustration } from "@/components/illustrations/JournalIllustration";
import { LoginButton } from "./LoginButton";

export default () => {
  return (
    <>
      <div className="flex items-center justify-between px-10 py-7">
        <Wordmark size="md" />
      </div>
      <div className="grid flex-1 grid-cols-2 items-center gap-10 px-10">
        <div className="w-full max-w-[440px] justify-self-center">
          <div className="rounded-3xl bg-card p-10">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Sign in
            </div>
            <h1 className="m-0 text-4xl font-semibold tracking-tight text-foreground leading-tight">
              Welcome back.
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-secondary-foreground">
              Sign in to your church&apos;s dashboard. Your giving history and upcoming services will be right where
              you left them.
            </p>

            <div className="mt-8">
              <LoginButton />
            </div>

            <div className="mt-5 text-center text-xs leading-normal text-muted-foreground">
              By continuing you agree to our{" "}
              <span className="text-secondary-foreground underline">Terms</span> and{" "}
              <span className="text-secondary-foreground underline">Privacy Policy</span>.
            </div>
          </div>
          <div className="mt-5 text-center text-xs text-muted-foreground">
            New to ChurchFlow? Ask your church administrator for an invite.
          </div>
        </div>
        <div className="relative h-[440px] w-full max-w-[440px] justify-self-center">
          <JournalIllustration />
        </div>
      </div>
      <div className="flex justify-between px-10 py-6 text-xs text-muted-foreground">
        <span>Built for churches.</span>
        <span className="flex gap-5">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Support</span>
        </span>
      </div>
    </>
  );
};
