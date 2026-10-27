import { assertDocument, type ProjectDocument } from "./document";
import { applyCommand, type Command } from "./commands";

export const HISTORY_LIMIT = 60;
export interface EditorSession {
  present: ProjectDocument;
  past: ProjectDocument[];
  future: ProjectDocument[];
}
export type SessionAction =
  | { type: "commit"; command: Command }
  | { type: "undo" }
  | { type: "redo" };
export function createSession(document: ProjectDocument): EditorSession {
  return { present: assertDocument(document), past: [], future: [] };
}
/** Pure reducer for atomic undo/redo; invalid commands throw without mutating session. */
export function reduceSession(session: EditorSession, action: SessionAction): EditorSession {
  if (action.type === "commit") {
    const next = applyCommand(session.present, action.command);
    return {
      present: next,
      past: [...session.past.slice(-(HISTORY_LIMIT - 1)), session.present],
      future: [],
    };
  }
  if (action.type === "undo") {
    if (!session.past.length) return session;
    return {
      present: session.past[session.past.length - 1],
      past: session.past.slice(0, -1),
      future: [session.present, ...session.future].slice(0, HISTORY_LIMIT),
    };
  }
  if (action.type === "redo") {
    if (!session.future.length) return session;
    return {
      present: session.future[0],
      past: [...session.past.slice(-(HISTORY_LIMIT - 1)), session.present],
      future: session.future.slice(1),
    };
  }
  return session;
}
