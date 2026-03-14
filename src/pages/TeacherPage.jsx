import { Link } from 'react-router-dom';
import Seo from '../app/seo/Seo.jsx';

function Section({ title, children }) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function CardGrid({ items }) {
  return (
    <div className="profile-grid">
      {items.map((item) => (
        <div key={item.title} className="profile-card">
          <strong>{item.title}</strong>
          <p>{item.body}</p>
        </div>
      ))}
    </div>
  );
}

const workflowSteps = [
  {
    title: 'Create a class',
    body: 'Set up a class and roster so students can get into the right activity quickly.',
  },
  {
    title: 'Students join with a class code',
    body: 'Students enter a code, choose their name, and start without creating a separate account.',
  },
  {
    title: 'Assign games and review results',
    body: 'Use games for practice or assignments, then review completion and performance in one place.',
  },
];

const benefits = [
  {
    title: 'Real staff notation',
    body: 'Students practice reading actual notes on a staff instead of relying on simplified app cues.',
  },
  {
    title: 'No student login friction',
    body: 'Students can get started with a class code and roster name instead of managing passwords.',
  },
  {
    title: 'Easy to fit into class',
    body: 'Use the games for centers, warmups, early finisher work, or take-home practice.',
  },
  {
    title: 'Teacher-friendly structure',
    body: 'Classes, assignments, and results make it easier to connect game practice to instruction.',
  },
];

const npmUses = [
  {
    title: 'Screening',
    body: 'Quickly identify which students have automated note recognition at a preset level and which students still need decoding support.',
  },
  {
    title: 'Instruction planning',
    body: 'Use the score pattern to tell whether a student needs note-recognition work, speed work, continuity work, or targeted repair on specific note groups.',
  },
  {
    title: 'Progress monitoring',
    body: 'Track growth over time with a measure that is easier to compare than a general impression like “getting better at reading.”',
  },
  {
    title: 'Parent communication',
    body: 'Show families concrete progress across the year with a measure of note-reading fluency that feels specific and professional.',
  },
];

const noteSpellerUses = [
  {
    title: 'Targeted note work',
    body: 'Use narrower note sets or specific clefs when students have gaps in one region, such as bass clef spaces or early ledger lines.',
  },
  {
    title: 'Automaticity through repetition',
    body: 'Students see the same notes many times in meaningful combinations, which helps move recognition from slow decoding toward faster recall.',
  },
  {
    title: 'Confidence building',
    body: 'Because the task is simple and game-like, students can get a lot of correct repetitions without the overload of full sight-reading.',
  },
  {
    title: 'Follow-up after NPM',
    body: 'If Notes Per Minute shows weak note groups or unstable recognition, Note Speller gives a straightforward way to reinforce exactly those gaps.',
  },
];

const uses = [
  {
    title: 'Centers',
    body: 'Set up a device station for focused independent practice while other groups rotate through other work.',
  },
  {
    title: 'Warmups',
    body: 'Use a short game session at the start of class to review note names, rhythm, or listening skills.',
  },
  {
    title: 'Early finisher work',
    body: 'Give students a structured digital activity that feels rewarding without needing extra directions.',
  },
  {
    title: 'Take-home practice',
    body: 'Assign a game that reinforces the same skill students are learning in class.',
  },
];

const games = [
  {
    title: 'Note Speller',
    body: 'Build note-name fluency by reading notes on the staff to spell real words, especially when students need repeated practice on a narrow note set.',
  },
  {
    title: 'Notes Per Minute',
    body: 'Measure how automatic note recognition is becoming at a given level, so teachers can separate decoding from broader sight-reading demands.',
  },
  {
    title: 'Chord Snowman',
    body: 'Practice interval and chord listening in a game built around ear training.',
  },
  {
    title: 'Bearglar',
    body: 'Reinforce rhythm, pulse, and timing through a fast-paced challenge.',
  },
];

export default function TeacherPage() {
  return (
    <main className="page">
      <Seo path="/teachers"/>
      <style>{`
        :root {
          --bg: #eef3f9;
          --panel: #fcfdff;
          --panel-soft: #f5f8fc;
          --text: #223043;
          --heading: #182433;
          --muted: #5e6b7c;
          --line: #d4dce7;
          --line-strong: #c3cedc;
          --green: #2f9d68;
          --blue: #527fc7;
          --gold: #c7953b;
          --shadow: 0 16px 36px rgba(18, 31, 49, 0.08);
          --bg-glow-a: rgba(82, 127, 199, 0.1);
          --bg-glow-b: rgba(47, 157, 104, 0.08);
          --eyebrow-bg: rgba(47, 157, 104, 0.12);
          --eyebrow-text: #23734d;
          --button-primary-start: #2f9d68;
          --button-primary-end: #58b688;
          --button-secondary-bg: #edf3fb;
          --button-secondary-text: #385f9f;
          --button-secondary-border: #c9d6e8;
          --callout-blue-bg: #edf4fb;
          --callout-green-bg: #eef8f2;
          --callout-gold-bg: #faf4e8;
          --profile-card-bg: #f6f8fc;
        }

        @media (prefers-color-scheme: dark) {
          :root {
            --bg: #0f1722;
            --panel: #121b29;
            --panel-soft: #162131;
            --text: #e6edf7;
            --heading: #f3f7fc;
            --muted: #a8b5c6;
            --line: #2b384b;
            --line-strong: #3a4960;
            --green: #57c38b;
            --blue: #7eabff;
            --gold: #d7aa57;
            --shadow: 0 20px 44px rgba(0, 0, 0, 0.28);
            --bg-glow-a: rgba(126, 171, 255, 0.14);
            --bg-glow-b: rgba(87, 195, 139, 0.1);
            --eyebrow-bg: rgba(87, 195, 139, 0.16);
            --eyebrow-text: #8fe0b5;
            --button-primary-start: #3aa56f;
            --button-primary-end: #4f8fd8;
            --button-secondary-bg: #182233;
            --button-secondary-text: #c8d8ff;
            --button-secondary-border: #33455f;
            --callout-blue-bg: #142334;
            --callout-green-bg: #13291f;
            --callout-gold-bg: #2b2417;
            --profile-card-bg: #141f2f;
          }
        }

        .page {
          min-height: 100vh;
          margin: 0;
          padding: 32px 18px 56px;
          color: var(--text);
          font-family: "Trebuchet MS", "Segoe UI", sans-serif;
          background-color: var(--bg);
          background:
            radial-gradient(circle at top right, var(--bg-glow-a), transparent 30%),
            radial-gradient(circle at top left, var(--bg-glow-b), transparent 24%),
            linear-gradient(180deg, var(--panel) 0%, var(--bg) 100%);
        }

        .page a {
          color: var(--blue);
        }

        .shell {
          max-width: 860px;
          margin: 0 auto;
        }

        .hero,
        .content,
        .related {
          color: var(--text);
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 24px;
          box-shadow: var(--shadow);
        }

        .hero,
        .content {
          padding: 28px;
        }

        .hero {
          margin-bottom: 20px;
        }

        .related {
          margin-top: 20px;
          padding: 24px 28px;
        }

        .eyebrow {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 999px;
          background: var(--eyebrow-bg);
          color: var(--eyebrow-text);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        h1 {
          margin: 14px 0 10px;
          font-size: clamp(32px, 5vw, 48px);
          line-height: 1.1;
          color: var(--heading);
        }

        h2 {
          margin: 28px 0 12px;
          font-size: 24px;
          color: var(--heading);
        }

        h3 {
          font-size: 19px;
          margin: 22px 0 8px;
          color: var(--heading);
        }

        p {
          margin: 0 0 16px;
          line-height: 1.7;
        }

        ul {
          padding-left: 20px;
          margin: 0;
        }

        li {
          margin-bottom: 8px;
        }

        .lede {
          font-size: 18px;
          color: var(--muted);
          max-width: 700px;
        }

        .cta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 18px;
        }

        .button {
          display: inline-block;
          padding: 14px 20px;
          border-radius: 14px;
          text-decoration: none;
          font-weight: 700;
        }

        .button.primary {
          background: linear-gradient(135deg, var(--button-primary-start), var(--button-primary-end));
          color: white;
        }

        .button.secondary {
          background: var(--button-secondary-bg);
          color: var(--button-secondary-text);
          border: 1px solid var(--button-secondary-border);
        }

        .button.tertiary {
          color: var(--muted);
        }

        .callout,
        .callout-green,
        .callout-gold {
          border-left-width: 4px;
          border-left-style: solid;
          border-radius: 0 12px 12px 0;
          padding: 16px 20px;
          margin: 20px 0;
        }

        .callout {
          background: var(--callout-blue-bg);
          border-left-color: var(--blue);
        }

        .callout-green {
          background: var(--callout-green-bg);
          border-left-color: var(--green);
        }

        .callout-gold {
          background: var(--callout-gold-bg);
          border-left-color: var(--gold);
        }

        .profile-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin: 18px 0;
        }

        .profile-card {
          background: var(--profile-card-bg);
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 16px 18px;
        }

        .profile-card strong {
          display: block;
          margin-bottom: 6px;
          color: var(--heading);
        }

        .profile-card p {
          margin: 0;
        }

        .faq-item {
          margin: 0 0 22px;
        }

        .related ul {
          margin-top: 14px;
          padding-left: 18px;
        }

        .footer-note {
          margin-top: 18px;
          color: var(--muted);
          font-size: 14px;
        }

        @media (max-width: 640px) {
          .hero,
          .content,
          .related {
            padding: 22px;
            border-radius: 18px;
          }
        }
      `}</style>

      <div className="shell">
        <section className="hero">
          <span className="eyebrow">For Music Teachers</span>
          <h1>Music games that support real classroom learning</h1>
          <p className="lede">
            Musical Caterpillar helps students practice note reading, ear training, rhythm, and music-making through
            browser-based games that are simple to use in class or at home.
          </p>
          <div className="callout-green">
            Students can join with a class code and choose their name. No separate student accounts required.
          </div>
          <div className="cta-row">
            <Link className="button primary" to="/note-speller">Try Note Speller</Link>
            <Link className="button secondary" to="/contact">Contact</Link>
            <Link className="button tertiary" to="/teacher/sign-in">Teacher Sign In</Link>
          </div>
        </section>

        <article className="content">
          <Section title="How it works">
            <p>Musical Caterpillar is designed to be easy to set up and easy to use during real classroom routines.</p>
            <CardGrid items={workflowSteps}/>
          </Section>

          <Section title="Why teachers use it">
            <p>The site keeps the fun of a game while supporting the kinds of skills teachers are already trying to build.</p>
            <CardGrid items={benefits}/>
          </Section>

          <Section title="Why this matters for sight-reading">
            <p>
              Sight-reading is difficult to teach because many musical demands happen at once. Musical Caterpillar helps
              isolate one foundational skill first: automatic note recognition.
            </p>
            <p>
              The logic is similar to early reading instruction. Students build decoding automaticity before fluent
              reading and comprehension can emerge. Music reading works the same way. If students are still spending
              heavy mental effort figuring out note names, they have less attention left for rhythm, phrasing,
              continuity, and expression.
            </p>
            <p>
              Musical Caterpillar does not claim that note recognition is the whole of sight-reading. The narrower claim
              is that it is a foundational component teachers can isolate, strengthen, and track in a cleaner way than
              full score reading alone.
            </p>
            <div className="callout-gold">
              <strong>Teaching takeaway:</strong> once note recognition becomes more automatic, students have more
              working memory available for rhythm, phrasing, and other higher-order reading demands.
            </div>
          </Section>

          <Section title="How teachers use Notes Per Minute">
            <p>
              Notes Per Minute is useful because it gives teachers a cleaner signal about whether note recognition at a
              given level has become automatic yet.
            </p>
            <CardGrid items={npmUses}/>
            <div className="profile-card">
              <strong>What different score patterns can suggest</strong>
              <ul>
                <li>High accuracy, high flow, low rate often points to a speed-building need, not a note-ID problem.</li>
                <li>High accuracy, low flow can mean the student knows the notes but still reads in a choppy, one-note-at-a-time way.</li>
                <li>Mid accuracy, high flow often means the student has a few weak note groups that need targeted repair.</li>
                <li>Low accuracy and low flow usually means the student is still in the decoding phase and should focus on recognition before tempo work.</li>
              </ul>
            </div>
            <p style={{ marginTop: 16 }}>
              <a href="/notes-per-minute-fluency/index.html" style={{ fontWeight: 700 }}>
                Read the full Notes Per Minute fluency benchmark guide
              </a>
            </p>
          </Section>

          <Section title="How teachers use Note Speller">
            <p>
              Note Speller supports the same automaticity goal from the other direction. Instead of measuring fluency
              under time pressure, it gives students repeated recognition practice inside a simple, motivating task.
            </p>
            <CardGrid items={noteSpellerUses}/>
            <p>
              In practice, the two tools can work together well: Notes Per Minute helps reveal whether note recognition
              is becoming automatic, and Note Speller gives students a focused way to strengthen the specific areas that
              still break down.
            </p>
          </Section>

          <Section title="Ways teachers use Musical Caterpillar">
            <p>The games work best when they support a specific classroom routine or skill focus.</p>
            <CardGrid items={uses}/>
          </Section>

          <Section title="Games for different music skills">
            <p>Each game focuses on one clear area of practice so students know what they are working on.</p>
            <CardGrid items={games}/>
          </Section>

          <Section title="Common questions">
            <div className="faq-item">
              <h3>Do students need accounts?</h3>
              <p>No. Students can join with a class code and choose their name from the class roster.</p>
            </div>
            <div className="faq-item">
              <h3>Does it work on tablets or laptops?</h3>
              <p>Yes. Musical Caterpillar is browser-based and designed to work across common classroom devices.</p>
            </div>
            <div className="faq-item">
              <h3>Can I use it with a whole class?</h3>
              <p>Yes. It can be used for centers, independent practice, and assignments across a full class roster.</p>
            </div>
            <div className="faq-item">
              <h3>Is it free?</h3>
              <p>The games are free to play. Teacher-facing workflows can support more structured classroom use.</p>
            </div>
          </Section>

          <Section title="Research-informed rationale">
            <p>
              This teaching logic is informed by cognitive load theory and fluency research. When basic symbol decoding
              is not automatic, working memory gets consumed by recognition, leaving fewer mental resources for
              higher-order musical tasks.
            </p>
            <p>
              Music-reading research has similarly found that stronger sight-readers tend to show more automatic note
              processing and a better ability to read ahead in the score. The evidence is stronger on theory and
              correlation than on strict causal proof, so the claim here is intentionally modest: note automaticity is
              not all of sight-reading, but it is one important part teachers can isolate and improve.
            </p>
            <p>
              Research commonly associated with this rationale includes work by Sweller, LaBerge and Samuels, Sloboda,
              and Lehmann and McArthur.
            </p>
          </Section>
        </article>

        <nav className="related">
          <h2>Related pages</h2>
          <ul>
            <li><a href="/notes-per-minute-fluency/index.html">Notes Per Minute fluency benchmark</a></li>
            <li><a href="/music-warmups/index.html">Music warmups</a></li>
            <li><a href="/how-to-teach-note-reading/index.html">How to teach note reading</a></li>
            <li><Link to="/contact">Contact Musical Caterpillar</Link></li>
          </ul>
          <p className="footer-note">
            This page is meant to help teachers evaluate how Musical Caterpillar fits classroom instruction, not just solo play.
          </p>
        </nav>
      </div>
    </main>
  );
}
