import { PageContentSkeleton } from "@/components/layout/PageContentSkeleton";

// Shown instantly inside the admin AppShell while a page segment renders
// (incl. its RSC prefetch), instead of freezing the previous page. Also what
// makes <Link> prefetch worthwhile for these dynamic routes.
export default () => <PageContentSkeleton />;
