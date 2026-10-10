import { useState } from "react";
import Modal from "./Modal";
import ColorPicker from "./ColorPicker";
import { inputCls } from "./AddBookModal";

// One modal for notes and bookmarks: change the name and the color, or delete.
// onSave receives { name, color }. onDelete is optional.
export default function ItemSettingsModal({
  heading,
  nameLabel = "Name",
  namePlaceholder = "",
  initialName = "",
  initialColor = null,
  deleteLabel = "Delete",
  deleteMessage = "Delete this item?",
  onSave,
  onDelete,
  onClose,
}) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);

  async function save() {
    await onSave({ name: name.trim(), color });
    onClose();
  }

  async function remove() {
    if (!confirm(deleteMessage)) return;
    await onDelete();
    onClose();
  }

  return (
    <Modal title={heading} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <label className="block text-sm text-white/70">
          {nameLabel}
          <input
            className={`${inputCls} mt-1`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={namePlaceholder}
          />
        </label>
        <div className="text-sm text-white/70">
          Color
          <div className="mt-2">
            <ColorPicker value={color} onChange={setColor} allowNone />
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        {onDelete ? (
          <button onClick={remove} className="text-red-400">
            {deleteLabel}
          </button>
        ) : (
          <span />
        )}
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
