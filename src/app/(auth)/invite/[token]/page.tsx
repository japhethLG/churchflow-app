import { InviteTokenPage } from "@/components/pages/invite";

export default ({ params }: { params: Promise<{ token: string }> }) => <InviteTokenPage params={params} />;
