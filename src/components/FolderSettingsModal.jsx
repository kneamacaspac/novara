import { useState } from "react";
import Modal from "./Modal";
import ColorPicker from "./ColorPicker";
import { inputCls } from "./AddBookModal";
import { updateFolder, deleteFolder } from "../services/noteService";

// Used on the folder page (gear button) and on the Notebook page (right-click a folder)
export default function FolderSettingsModal({
  folder,
  noteCount = 0,
  onClose,
  onDeleted,
}) {
  const [name, setName] = useState(folder.name);
  const [color, setColor] = useState(folder.color || "#7c6cff");
  const [description, setDescription] = useState(folder.description || "");
  const [sort, setSort] = useState(folder.sort || "updated");

  async function save() {
    await updateFolder(folder.id, {
      name: name.trim() || folder.name,
      color,
      description: description.trim(),
      sort,
    });
    onClose();
  }

  async function remove() {
    const message = noteCount
      ? `Delete "${folder.name}" and its ${noteCount} note${noteCount === 1 ? "" : "s"}? Bookmarks inside will be kept, without a folder.`
      : `Delete the folder "${folder.name}"?`;
    if (!confirm(message)) return;
    await deleteFolder(folder.id);
    onClose();
    if (onDeleted) onDeleted();
  }

  const label = "block text-sm text-white/70";

  return (
    <Modal title="Folder settings" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <label className={label}>
          Name
          <input
            className={`${inputCls} mt-1`}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <div className={label}>
          Color
          <div className="mt-2">
            <ColorPicker value={color} onChange={setColor} />
          </div>
        </div>

        <label className={label}>
          Description (optional)
          <input
            className={`${inputCls} mt-1`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this folder for?"
          />
        </label>

        <label className={label}>
          Sort notes by
          <select
            className={`${inputCls} mt-1`}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="updated">Recently edited</option>
            <option value="oldest">Oldest first</option>
            <option value="title">Title (A to Z)</option>
          </select>
        </label>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button onClick={remove} className="text-red-400">
          Delete folder
        </button>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="rounded-lg bg-accent px-4 py-2 font-medium"
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
