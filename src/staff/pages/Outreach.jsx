import { CGL } from "../../data/rooms.js";
import StartFinishFlow from "../components/StartFinishFlow.jsx";

function Outreach() {
  return (
    <StartFinishFlow
      table="staff_outreach"
      title="Outreach"
      subtitle="Record going on and returning from outreach — for lone-working safety."
      color={CGL.raspberry}
      fields={[
        { key: "location", label: "Where are you going?", placeholder: "e.g. service user's home, community venue" },
        { key: "expected_return", label: "Expected return time", type: "time" },
      ]}
    />
  );
}

export default Outreach;
