"use client";

import { Suspense } from "react";

import { NotesApp } from "@/components/notes/notes-app";

function NotesPageFallback() {
  return (
    <div className="animate-pulse p-6" role="status" aria-label="Loading notes">
      <div className="bg-muted mb-6 h-8 w-40 rounded-lg" />
      <div className="bg-muted h-64 rounded-2xl" />
    </div>
  );
}

export function NotesPageView() {
  return (
    <Suspense fallback={<NotesPageFallback />}>
      <NotesApp />
    </Suspense>
  );
}
