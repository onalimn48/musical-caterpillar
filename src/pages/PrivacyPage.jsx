import InfoPageLayout from './InfoPageLayout.jsx';

function Section({ title, children }) {
  return (
    <section>
      <h2 style={{ fontSize: '1.5rem', margin: '0 0 12px' }}>{title}</h2>
      <div style={{ lineHeight: 1.8, color: '#334155' }}>{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <InfoPageLayout
      path="/privacy"
      eyebrow="Privacy"
      title="Privacy Policy"
      intro="Musical Caterpillar is designed to be simple to use without requiring a general consumer account. This page explains what information is stored and when it is used."
    >
      <Section title="What Musical Caterpillar collects">
        <p style={{ margin: '0 0 12px' }}>
          Musical Caterpillar stores some information in your browser so games can remember progress, saved settings,
          and returning student selections on that device.
        </p>
        <p style={{ margin: 0 }}>
          If a teacher uses the classroom tools, the site may also store teacher account details, class rosters,
          assignments, and assignment results that are necessary for the service to function.
        </p>
      </Section>

      <Section title="Student data">
        <p style={{ margin: '0 0 12px' }}>
          Student information is limited to what a teacher enters for classroom use, such as a display name, class
          membership, assignment progress, and scores.
        </p>
        <p style={{ margin: 0 }}>
          Musical Caterpillar is intended for educational use. Teachers and schools are responsible for deciding what
          student information they enter into the platform.
        </p>
      </Section>

      <Section title="How information is used">
        <p style={{ margin: '0 0 12px' }}>
          Information is used to run the games, save progress, support classroom assignments, and show teachers student
          results.
        </p>
        <p style={{ margin: 0 }}>
          Musical Caterpillar does not sell personal information or use student information for advertising.
        </p>
      </Section>

      <Section title="Browser storage and third parties">
        <p style={{ margin: '0 0 12px' }}>
          The site uses browser storage on your device. Teacher and assignment features also rely on backend services to
          store classroom data.
        </p>
        <p style={{ margin: 0 }}>
          Musical Caterpillar may use standard hosting and infrastructure providers to operate the website.
        </p>
      </Section>

      <Section title="Contact">
        <p style={{ margin: 0 }}>
          Privacy questions can be sent to <a href="mailto:support@musicalcaterpillar.com">support@musicalcaterpillar.com</a>.
        </p>
      </Section>
    </InfoPageLayout>
  );
}
