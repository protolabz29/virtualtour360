import React from "react";

export default function Button({ onClick, text }) {
  return (
    <button
      onClick={onClick}
      className="absolute top-4 left-4 z-10 px-4 py-2 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-md transition-all duration-300"
    >
      {text}
    </button>
  );
}
