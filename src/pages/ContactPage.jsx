import InfoPageLayout from './InfoPageLayout.jsx';

export default function ContactPage() {
  return (
    <InfoPageLayout
      path="/contact"
      eyebrow="Contact"
      title="Contact Musical Caterpillar"
      intro="Questions from teachers, parents, and schools are welcome."
    >
      <section>
        <h2 style={{ fontSize: '1.5rem', margin: '0 0 12px' }}>Email</h2>
        <p style={{ lineHeight: 1.8, color: '#334155', margin: '0 0 12px' }}>
          The best way to reach Musical Caterpillar is by email:
        </p>
        <p style={{ margin: 0 }}>
          <a
            href="mailto:support@musicalcaterpillar.com"
            style={{ color: '#2563eb', fontWeight: 700, fontSize: '1.05rem' }}
          >
            support@musicalcaterpillar.com
          </a>
        </p>
      </section>

      <section>
        <h2 style={{ fontSize: '1.5rem', margin: '0 0 12px' }}>Good things to include</h2>
        <ul style={{ margin: 0, paddingLeft: 24, lineHeight: 1.8, color: '#334155' }}>
          <li>Whether you are a teacher, parent, or student</li>
          <li>Which game or page you were using</li>
          <li>What device and browser you were on</li>
          <li>A screenshot or short description of the issue or request</li>
        </ul>
      </section>

      <section>
        <h2 style={{ fontSize: '1.5rem', margin: '0 0 12px' }}>Classroom and school inquiries</h2>
        <p style={{ lineHeight: 1.8, color: '#334155', margin: 0 }}>
          If you are interested in using Musical Caterpillar with a studio, classroom, or school program, include a
          short note about your teaching setup and the age range of your students.
        </p>
      </section>
    </InfoPageLayout>
  );
}
