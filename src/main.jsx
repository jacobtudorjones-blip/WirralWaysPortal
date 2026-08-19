import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// Note: deliberately not wrapped in <React.StrictMode> — several effects in
// this app trigger real network side-effects (Supabase writes, Brevo emails),
// and StrictMode's dev-only double-invoke would double-fire them locally.
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
