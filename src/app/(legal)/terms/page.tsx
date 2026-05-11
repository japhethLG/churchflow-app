import type { Metadata } from "next";
import { LegalArticle, LegalSection } from "@/components/pages/landing";

export const metadata: Metadata = {
	title: "Terms of Service · ChurchFlow",
	description: "The terms that govern your use of ChurchFlow.",
};

export default () => {
	return (
		<LegalArticle
			eyebrow="Legal"
			title="Terms of Service"
			lastUpdated="May 11, 2026"
		>
			<p>
				These Terms of Service (&quot;Terms&quot;) govern your use of the
				ChurchFlow application and services (the &quot;Service&quot;). By
				signing in to ChurchFlow, you agree to be bound by these Terms. If you
				don&apos;t agree, please don&apos;t use the Service.
			</p>

			<LegalSection title="1. Who can use ChurchFlow">
				<p>
					You may use ChurchFlow if you are at least the age of majority in your
					jurisdiction and capable of forming a binding contract. If you&apos;re
					using the Service on behalf of a church or other organisation, you
					confirm that you have authority to bind that organisation to these
					Terms.
				</p>
			</LegalSection>

			<LegalSection title="2. Your account">
				<p>
					You are responsible for keeping your sign-in credentials secure and
					for everything that happens under your account. Use the &quot;sign out
					of all devices&quot; feature if you suspect your account has been
					accessed by someone else. Notify us promptly of any suspected
					unauthorised use.
				</p>
			</LegalSection>

			<LegalSection title="3. Acceptable use">
				<p>You agree not to:</p>
				<ul className="ml-6 list-disc space-y-2">
					<li>
						Use the Service to violate any applicable law or regulation,
						including those governing religious nonprofits and donor privacy.
					</li>
					<li>
						Access data belonging to a church you are not a member of, or
						attempt to bypass our tenant isolation, role gating, or rate limits.
					</li>
					<li>
						Upload malware, conduct security testing without prior written
						permission, or interfere with the Service&apos;s normal operation.
					</li>
					<li>
						Misrepresent your identity or impersonate another member or admin of
						a church.
					</li>
				</ul>
			</LegalSection>

			<LegalSection title="4. Your data and content">
				<p>
					Your church owns the data it records in ChurchFlow. You grant us a
					limited licence to host, process, back up, and display that data
					solely for the purpose of operating the Service. We will not sell your
					data, and we will only access it ourselves to provide, secure, and
					improve the Service.
				</p>
			</LegalSection>

			<LegalSection title="5. Fees">
				<p>
					ChurchFlow is provided to your church under the pricing agreed with
					your church admin (today the Service is offered without charge).
					We&apos;ll give you reasonable advance notice before introducing any
					fees for features your church already uses.
				</p>
			</LegalSection>

			<LegalSection title="6. Service availability">
				<p>
					We strive to keep ChurchFlow available and performant, but we
					can&apos;t promise uninterrupted service. We may perform maintenance,
					deploy updates, or experience outages — and we&apos;ll communicate
					planned maintenance ahead of time whenever reasonable.
				</p>
			</LegalSection>

			<LegalSection title="7. Termination">
				<p>
					You may stop using the Service at any time. We may suspend or
					terminate access if you violate these Terms, if required by law, or if
					continued provision creates undue risk. On termination, we&apos;ll
					work in good faith with your church admin to export or delete the data
					your church controls.
				</p>
			</LegalSection>

			<LegalSection title="8. Disclaimer">
				<p>
					The Service is provided &quot;as is&quot; and &quot;as
					available&quot;, without warranties of any kind, express or implied,
					including warranties of merchantability, fitness for a particular
					purpose, and non-infringement. ChurchFlow is not a substitute for
					professional financial, legal, or tax advice for your church.
				</p>
			</LegalSection>

			<LegalSection title="9. Limitation of liability">
				<p>
					To the maximum extent permitted by law, ChurchFlow will not be liable
					for any indirect, incidental, special, consequential, or punitive
					damages, or any loss of giving records, goodwill, or data, arising out
					of or related to your use of the Service.
				</p>
			</LegalSection>

			<LegalSection title="10. Changes to these Terms">
				<p>
					We may update these Terms from time to time. When we do, we&apos;ll
					update the &quot;last updated&quot; date at the top of this page, and
					— for material changes — surface a notification in the app the next
					time you sign in. Continued use of the Service after an update means
					you accept the revised Terms.
				</p>
			</LegalSection>

			<LegalSection title="11. Contact">
				<p>Questions about these Terms? Email us at japhethlouie@gmail.com.</p>
			</LegalSection>
		</LegalArticle>
	);
};
