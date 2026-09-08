import { Link } from "react-router-dom";
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

// Covers the whole portal, not just the Staff Portal half — Room Booking
// collects and stores personal data too (who booked what, for whom, and
// an audit log of who approved/rejected/cancelled it), and both halves
// share the same underlying storage and email provider. This lives at
// /staff/privacy (unchanged, so existing links/bookmarks keep working)
// but IdentityScreen.jsx links to it from the Room Booking side too.
function PrivacyPolicy() {
  return (
    <PageWrap title="Privacy notice" subtitle="What the Wirral Ways portal records, why, and where it's kept." maxWidth={680}>
      <Section title="What's recorded — Staff Portal">
        Your name, email address, work site, role and manager (held in the staff directory).
        Sign-in/sign-out records: your name, the site or working mode (working from home,
        working elsewhere, or outreach), and the time. Outreach and "working elsewhere" records
        also include a location and, for outreach, an expected return time. Leave and non-working
        days you (or your manager) record for you. Anything typed into a notes field is stored as
        entered. If you sign in as a visitor, we record who you're here to see. None of this is
        shown with times anywhere in the app except the admin dashboard — the rest of the app only
        ever shows presence ("signed in at Market Street"), not when.
      </Section>
      <Section title="What's recorded — Room Booking">
        Your name and CGL email address, and details of any room booking you make or that's made
        on your behalf: room, date, time, purpose, and any notes. If a booking is made on someone
        else's behalf, both the requester's and the other person's name and email are recorded
        against it. Every request, approval, rejection and cancellation is written to an audit log
        against the name of whoever did it.
      </Section>
      <Section title="What's recorded — Car Booking">
        Your name and CGL email address, and details of any booking you make for the shared work
        car, or that's made on your behalf: date, time, what it's needed for, and any notes. If a
        booking is made on someone else's behalf, both the requester's and the other person's name
        and email are recorded against it. Every request, approval, rejection and cancellation is
        written to the booking record against the name of whoever did it — same pattern as Room
        Booking's audit trail.
      </Section>
      <Section title="Why">
        For health and safety, fire safety, and lone-working purposes on the Staff Portal side —
        so it's known who is on site (for fire evacuation and roll call) and who is working alone
        off-site, and when they were expected back. On Room Booking and Car Booking, to manage
        shared resources fairly and keep a record of who requested and approved each booking.
      </Section>
      <Section title="Who can see it">
        Staff signed in with an <strong>admin</strong> or <strong>manager</strong> role in the
        staff directory can view the live "who's in" view and the admin sign-in log
        (times included). A person's manager also gets an email if they're significantly overdue
        back from outreach. On Room Booking and Car Booking,
        anyone on the relevant approver list (or with the admin role in the staff directory) can
        see booking requests — who made them, who they're for, and what they're for — in order to
        approve or reject them. This is enforced by the app itself, not by additional encryption —
        see the technical note in this project's README if you need to assess exactly how.
      </Section>
      <Section title="Where it's stored, and who else handles it">
        Portal data (the staff directory, attendance records, leave, and room and car bookings) is
        stored in a <strong>Supabase</strong> database. The portal itself is hosted on{" "}
        <strong>Netlify</strong>. Emails the portal sends — visitor notifications, overdue-outreach
        alerts to managers, and room and car booking confirmations and reminders — are sent through{" "}
        <strong>Brevo</strong>, a transactional email provider; Brevo only ever receives what's
        needed to send that specific email (recipient, subject, message body), not the wider
        database. None of these providers are given access beyond what's needed to run the
        portal, and none of them are permitted to use the data for their own purposes.
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
        Attendance, leave and booking records are kept only as long as needed for health &
        safety, room-management and audit purposes. If your organisation has a specific retention
        period configured for this system, ask an admin — it isn't enforced automatically by this
        app.
      </Section>
      <div style={{ marginTop: 24, textAlign: "center" }}>
        <Link to="/" style={{ fontSize: 12, color: "#9ca3af" }}>← Back to the portal</Link>
      </div>
    </PageWrap>
  );
}

export default PrivacyPolicy;
