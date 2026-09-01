import { CGL } from "../../data/rooms.js";
import StartFinishFlow from "../components/StartFinishFlow.jsx";

function Wfh() {
  return (
    <StartFinishFlow
      table="staff_wfh"
      title="Working from home"
      subtitle="Record when you start and finish working from home."
      color={CGL.ocean}
      fields={[]}
    />
  );
}

export default Wfh;
