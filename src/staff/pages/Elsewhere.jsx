import { CGL } from "../../data/rooms.js";
import StartFinishFlow from "../components/StartFinishFlow.jsx";

function Elsewhere() {
  return (
    <StartFinishFlow
      table="staff_elsewhere"
      title="Working elsewhere"
      subtitle="Record when you start and finish working at another location."
      color={CGL.saffron}
      fields={[{ key: "location", label: "Location", placeholder: "e.g. partner office, training venue" }]}
    />
  );
}

export default Elsewhere;
