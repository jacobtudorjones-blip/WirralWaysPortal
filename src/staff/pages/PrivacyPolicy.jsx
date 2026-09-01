import PageWrap from "../components/PageWrap.jsx";
import { CGL } from "../../data/rooms.js";

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h3 style={{ fontSize: 13, fontWeight: 800, color: CGL.blackcurrant, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{title}</h3>
      <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

function PrivacyPolicy() {
  return (
    <PageWrap title="Privacy notice" subtitle="What we record and why." maxWidth={680}>
      <Section title="What's recorded">
        Your name, the site (or WFH/outreach/elsewhere status), and the time you sign in and out.
        Outreach and "working elsewhere" records also include a location and, for outreach, an
        expected return time. Anything you type into a notes field is stored as entered.
      </Section>
      <Section title="Why">
        For health and safety, fire safety, and lone-working purposes — so it's known who is on
        site (for fire evacuation and roll call) and who is working alone off-site, and when they
        were expected back.
      </Section>
      <Section title="Who can see it">
        Staff signed in with an <strong>admin</strong> or <strong>manager</strong> role in the
        staff directory can view the live "who's in" view and the admin sign-in log. This is
        enforced in the app, not by encryption — see the technical note in this project's README
        if you need to assess exactly how.
      </Section>
      <Section title="Data controller & your rights">
        Change Grow Live (CGL) is the data controller. Under UK GDPR you can ask to see, correct,
        or ask us to delete the personal data held about you — speak to your line manager or your
        organisation's Data Protection Officer. You also have the right to complain to the
        Information Commissioner's Office (ICO) at{" "}
        <a href="https://ico.org.uk" style={{ color: CGL.blackcurrant }}>ico.org.uk</a> or by
        calling 0303 123 1113.
      </Section>
      <Section title="Retention">
        Attendance records are kept only as long as needed for health & safety and audit purposes.
        If your organisation has a specific retention period configured for this system, ask an
        admin — it isn't enforced automatically by this app.
      </Section>
    </PageWrap>
  );
}

export default PrivacyPolicy;
