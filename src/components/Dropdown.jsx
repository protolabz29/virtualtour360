import React from "react";

export default function Dropdown({ viewMode, panoramas, onChange }) {
  return (
    <div className="absolute top-4 right-4 z-20 p-2 bg-black rounded">
      <select
        onChange={(e) => onChange(e.target.value)}
        value={viewMode}
        className="bg-black text-white p-1 rounded"
      >
        {panoramas[0].images.map((img) => (
          <option key={img.key} value={img.key}>
            {img.key}
          </option>
        ))}
      </select>
    </div>
  );
}
