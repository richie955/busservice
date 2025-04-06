// components/ui/Select.jsx
import React, { useState } from "react";

export function Select({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative w-full max-w-[180px]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-left bg-white"
      >
        {value || placeholder}
      </button>
      {open && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          {options.map((option) => (
            <div
              key={option}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
