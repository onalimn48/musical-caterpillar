import InfoPageLayout from './InfoPageLayout.jsx';

function Section({ title, children }) {
  return (
    <section>
      <h2 style={{ fontSize: '1.5rem', margin: '0 0 12px' }}>{title}</h2>
      <div style={{ lineHeight: 1.8, color: '#334155' }}>{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <InfoPageLayout
      path="/terms"
      eyebrow="Terms"
      title="Terms of Use"
      intro="These terms govern access to Musical Caterpillar and its games, teacher tools, and classroom features."
    >
      <Section title="Using the site">
        <p style={{ margin: '0 0 12px' }}>
          You may use Musical Caterpillar for personal, educational, and classroom purposes as long as you use it
          lawfully and do not interfere with the service.
        </p>
        <p style={{ margin: 0 }}>
          You may not misuse the website, attempt unauthorized access, or use the platform to upload harmful or
          misleading content.
        </p>
      </Section>

      <Section title="Teacher accounts and classroom content">
        <p style={{ margin: '0 0 12px' }}>
          Teachers are responsible for the class rosters, assignments, and other content they create or upload.
        </p>
        <p style={{ margin: 0 }}>
          Teachers should only enter student information they are authorized to manage.
        </p>
      </Section>

      <Section title="Availability">
        <p style={{ margin: '0 0 12px' }}>
          Musical Caterpillar is provided on an as-is basis. Features may change, improve, or be removed over time.
        </p>
        <p style={{ margin: 0 }}>
          While reasonable effort is made to keep the service available, uninterrupted access is not guaranteed.
        </p>
      </Section>

      <Section title="Intellectual property">
        <p style={{ margin: '0 0 12px' }}>
          Musical Caterpillar, its original game design, branding, artwork, and written content are protected by
          applicable intellectual property laws unless otherwise noted.
        </p>
        <p style={{ margin: 0 }}>
          Third-party assets remain subject to their own licenses and attribution terms.
        </p>
      </Section>

      <Section title="Contact">
        <p style={{ margin: 0 }}>
          Questions about these terms can be sent to <a href="mailto:support@musicalcaterpillar.com">support@musicalcaterpillar.com</a>.
        </p>
      </Section>
    </InfoPageLayout>
  );
}
