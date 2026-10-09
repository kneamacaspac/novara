import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Library from "./pages/Library";
import Reader from "./pages/Reader";
import Notebook from "./pages/Notebook";
import NoteEditor from "./pages/NoteEditor";
import Tracker from "./pages/Tracker";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route path="/read/:id" element={<Reader />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/library" element={<Library />} />
        <Route path="/notebook" element={<Notebook />} />
        <Route path="/notebook/:folderId" element={<NoteEditor />} />
        <Route path="/tracker" element={<Tracker />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
