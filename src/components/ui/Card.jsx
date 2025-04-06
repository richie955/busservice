// components/ui/Card.jsx
import React from "react";

export function Card({ children }) {
  return (
    <div className="rounded-2xl border bg-white shadow-md p-4">
      {children}
    </div>
  );
}

export function CardContent({ children }) {
  return <div className="py-2">{children}</div>;
}
