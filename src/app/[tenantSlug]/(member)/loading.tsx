import { PageContentSkeleton } from "@/components/layout/PageContentSkeleton";

// Shown instantly inside the member AppShell while a page segment renders
// (incl. its RSC prefetch), instead of freezing the previous page.
export default () => <PageContentSkeleton />;
