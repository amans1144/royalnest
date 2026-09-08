import type { Metadata } from 'next';
import { LegalPage } from '../../components/legal-page';
import { BRAND } from '../../lib/site-data';

/**
 * ⚠️ REVIEW BEFORE LAUNCH — this is standard boilerplate covering what the site
 * actually does today (an enquiry form and optional Google Analytics). It has
 * not been reviewed by a lawyer. Have counsel check it against the DPDP Act,
 * 2023 and confirm the grievance-officer details before going live.
 */

const DESCRIPTION = `How ${BRAND.name} collects, uses and protects the personal information you share through this website.`;

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: DESCRIPTION,
  alternates: { canonical: '/privacy' },
  openGraph: { type: 'article', url: '/privacy', title: 'Privacy Policy', description: DESCRIPTION },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="23 August 2026">
      <p>
        {BRAND.name} (“we”, “us”) operates this website to market its plotted developments in
        Lucknow. This policy explains what personal information we collect through the site, why we
        collect it, and the choices you have. It applies only to this website.
      </p>

      <h2>Information we collect</h2>
      <p>We collect information in two ways:</p>
      <ul>
        <li>
          <strong>Information you give us.</strong> When you submit the enquiry form or a site-visit
          request, we collect your name, phone number, email address (optional), the type of plot
          you are interested in, and anything you write in the message field.
        </li>
        <li>
          <strong>Information collected automatically.</strong> If analytics is enabled, Google
          Analytics records standard usage data such as pages viewed, approximate location, device
          and browser type, and referring site. This is aggregate traffic data, not information that
          identifies you by name.
        </li>
      </ul>
      <p>
        We do not ask for and do not want financial information, government identity numbers, or
        other sensitive personal data through this website.
      </p>

      <h2>How we use it</h2>
      <ul>
        <li>To respond to your enquiry and share project details, pricing and availability.</li>
        <li>To arrange and follow up on site visits.</li>
        <li>To send you information about our projects, where you have asked to receive it.</li>
        <li>To understand how the site is used so we can improve it.</li>
      </ul>
      <p>
        We do not sell your personal information. We share it only with team members and service
        providers who need it to respond to you — and only for that purpose.
      </p>

      <h2>Cookies and analytics</h2>
      <p>
        This site uses cookies only where analytics is enabled, to distinguish one visit from
        another. You can block or delete cookies in your browser settings; the site works without
        them. Google Analytics is operated by Google, whose own privacy terms apply to the data it
        processes.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep enquiry details for as long as needed to serve you as a prospective buyer, and
        thereafter as required by law or to resolve disputes. You can ask us to delete your details
        sooner.
      </p>

      <h2>Your rights</h2>
      <p>
        You may ask us to give you a copy of the personal information we hold about you, correct it
        if it is wrong, delete it, or stop sending you marketing messages. Write to the address
        below and we will respond within a reasonable period.
      </p>

      <h2>Security</h2>
      <p>
        We take reasonable technical and organisational measures to protect the information you
        share with us. No method of transmission over the internet is completely secure, so we
        cannot guarantee absolute security.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this policy from time to time. The “last updated” date at the top of this page
        always reflects the current version.
      </p>
    </LegalPage>
  );
}
