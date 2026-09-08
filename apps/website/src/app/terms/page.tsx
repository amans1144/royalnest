import type { Metadata } from 'next';
import { LegalPage } from '../../components/legal-page';
import { BRAND, PROJECT } from '../../lib/site-data';

/**
 * ⚠️ REVIEW BEFORE LAUNCH — standard boilerplate, not reviewed by a lawyer.
 * The disclaimer section matters most here: the site markets a pre-RERA launch,
 * so have counsel confirm the wording satisfies RERA advertising rules and that
 * the registration number shown in the footer is the correct one to publish.
 */

const DESCRIPTION = `Terms governing your use of the ${BRAND.name} website and the information published on it.`;

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: DESCRIPTION,
  alternates: { canonical: '/terms' },
  openGraph: {
    type: 'article',
    url: '/terms',
    title: 'Terms & Conditions',
    description: DESCRIPTION,
  },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms &amp; Conditions" updated="23 August 2026">
      <p>
        These terms govern your use of this website, operated by {BRAND.name}. By using the site you
        accept them. If you do not agree, please do not use the site.
      </p>

      <h2>The information on this site is indicative</h2>
      <p>
        Everything published here — layouts, plot sizes, facings, amenities, images, renders,
        distances and drive times — is indicative and for general information only. Renders and
        photographs are artistic impressions and may not depict the completed development. Amenities
        shown are proposed and may change.
      </p>
      <p>
        Nothing on this site is an offer, an invitation to offer, or a contract of any kind. No rate
        is published here; prices, charges and availability are confirmed by our advisors on
        enquiry, and are subject to revision without notice.
      </p>

      <h2>RERA</h2>
      <p>
        {PROJECT.name} is presented at a {PROJECT.status.toLowerCase()} stage. Booking terms,
        payment schedules and allotment are governed solely by the written agreement executed
        between you and the developer, and by the applicable RERA registration. In the event of any
        inconsistency between this website and those documents, the documents prevail. Please verify
        the project’s registration on the UP RERA portal before making any payment.
      </p>

      <h2>Use of the site</h2>
      <ul>
        <li>Use the site only for lawful purposes and for genuine enquiries.</li>
        <li>Do not attempt to disrupt, probe or gain unauthorised access to the site.</li>
        <li>
          Do not copy, republish or use our text, images, logos or layouts commercially without our
          written permission.
        </li>
      </ul>

      <h2>Intellectual property</h2>
      <p>
        The {BRAND.name} name and logo, and the content and design of this site, belong to us or our
        licensors and are protected by law.
      </p>

      <h2>Third-party links</h2>
      <p>
        The site links to third-party services such as WhatsApp and, where embedded, video
        platforms. We do not control those services and are not responsible for their content or
        their handling of your data.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        The site is provided “as is”. To the extent permitted by law, we are not liable for any
        indirect or consequential loss arising from your use of the site or from reliance on
        indicative information published on it.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of India. The courts at Lucknow, Uttar Pradesh have
        exclusive jurisdiction over any dispute arising from them.
      </p>

      <h2>Changes</h2>
      <p>
        We may revise these terms at any time. The “last updated” date at the top of this page
        always reflects the current version.
      </p>
    </LegalPage>
  );
}
