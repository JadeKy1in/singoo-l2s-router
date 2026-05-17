import { Routes, Route } from "react-router-dom";
import SessionList from "@/pages/SessionList";
import ConversationView from "@/pages/ConversationView";
import NewThread from "@/pages/NewThread";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SessionList />} />
      <Route path="/view/:sessionId" element={<ConversationView />} />
      <Route path="/new" element={<NewThread />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
