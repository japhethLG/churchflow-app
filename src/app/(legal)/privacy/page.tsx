import type { Metadata } from "next";
import { LegalArticle, LegalSection } from "@/components/pages/landing";

export const metadata: Metadata = {
	title: "Privacy Policy · ChurchFlow",
	description: "How ChurchFlow collects, uses, and protects your data.",
};

export default () => {
	return (
		<LegalArticle
			eyebrow="Legal"
			title="Privacy Policy"
			lastUpdated="May 11, 2026"
		>
			<p>
				ChurchFlow ("we", "our", or "us") helps churches record giving, manage
				members, and run stewardship campaigns. This Privacy Policy explains
				what information we collect when you use the ChurchFlow application, how
				we use it, and the choices you have. We&apos;ve tried to write this in
				plain English. If anything is unclear, please reach out — we&apos;d
				rather be transparent than legally precise.
			</p>

			<LegalSection title="1. Information we collect">
				<p>
					When you create an account, we collect your name, email address, and
					authentication metadata from your sign-in provider (currently Google).
					When you join a church as a member or admin, we also store information
					your church chooses to record about you — for example, your contact
					details, giving history, and pledges.
				</p>
				<p>
					We do not knowingly collect information from children under the age
					your church determines to be a minor for record-keeping purposes.
				</p>
			</LegalSection>

			<LegalSection title="2. How we use information">
				<p>
					We use your information to operate ChurchFlow — including
					authenticating you, scoping you to the churches you belong to,
					recording giving on behalf of your church, generating reports for
					authorised admins, and sending operational emails (for example,
					invitation acceptance and sign-out notifications).
				</p>
				<p>
					We do not sell your personal data, and we do not use it for
					advertising. We use a minimal set of essential cookies (a session
					cookie to keep you signed in and a CSP nonce per request) — no
					tracking cookies or third-party analytics that profile you.
				</p>
			</LegalSection>

			<LegalSection title="3. How data is isolated between churches">
				<p>
					Every church is its own tenant in ChurchFlow. Members of one church
					cannot read another church&apos;s data. Tenant isolation is enforced
					on the server, not just in the user interface. A super-admin role
					exists for platform operations and is used sparingly; super-admin
					actions are audited.
				</p>
			</LegalSection>

			<LegalSection title="4. Who we share data with">
				<p>
					We share information with the infrastructure providers required to run
					the service — including our authentication provider (Google Firebase),
					our database host, and the cloud provider that runs our servers. Each
					of these providers is bound by their own data-processing terms.
				</p>
				<p>
					We may disclose information if required to do so by law, or if we
					reasonably believe disclosure is necessary to protect our rights, your
					safety, or the safety of others.
				</p>
			</LegalSection>

			<LegalSection title="5. Data retention">
				<p>
					Personal information is retained for as long as your church maintains
					an active account, and for a reasonable period afterwards to satisfy
					tax and audit obligations applicable to religious nonprofits. You can
					request export or deletion of your personal information at any time by
					contacting your church admin, who can then escalate the request to us.
				</p>
			</LegalSection>

			<LegalSection title="6. Your choices">
				<p>
					You can sign out of any device, sign out of all devices at once,
					update your profile, or ask your church admin to update or remove
					information your church has recorded about you. If you&apos;d like a
					copy of your data or want it deleted entirely, contact your church
					admin first; we will work with them on the request.
				</p>
			</LegalSection>

			<LegalSection title="7. Changes to this policy">
				<p>
					We may update this Privacy Policy from time to time. When we do,
					we&apos;ll update the &quot;last updated&quot; date at the top of this
					page, and — for material changes — surface a notification in the app
					the next time you sign in.
				</p>
			</LegalSection>

			<LegalSection title="8. Contact">
				<p>
					Questions? Email us at japhethlouie@gmail.com. We read every message
					and aim to respond within a few business days.
				</p>
			</LegalSection>
		</LegalArticle>
	);
};
