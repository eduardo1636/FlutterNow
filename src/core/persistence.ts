import {
  CURRENT_STORAGE_KEY, LEGACY_BACKUP_KEY, LEGACY_STORAGE_KEY,
  createDocument, migrateLegacy, parseDocumentJSON, serializeDocument,
  type ProjectDocument,
} from "./document";
import { parseProjectJSON } from "../editor/project.js";

export interface StorageBootstrap {
  document: ProjectDocument;
  locked: boolean;
  warning: string | null;
}
export function loadStoredDocument(storage: Pick<Storage, "getItem" | "setItem">): StorageBootstrap {
  let current: string | null;
  let old: string | null;
  try {
    current = storage.getItem(CURRENT_STORAGE_KEY);
    old = storage.getItem(LEGACY_STORAGE_KEY);
  } catch {
    return {
      document: createDocument(), locked: true,
      warning: "Armazenamento indisponível. Exporte o projeto antes de sair.",
    };
  }
  if (current !== null) {
    try {
      return { document: parseDocumentJSON(current), locked: false, warning: null };
    } catch {
      return {
        document: createDocument(), locked: true,
        warning: "O projeto salvo não pôde ser lido. Seus dados originais foram preservados. Importe um backup JSON para continuar.",
      };
    }
  }
  if (old !== null) {
    try {
      const legacy = parseProjectJSON(old);
      const migrated = migrateLegacy(legacy);
      // Never overwrite the old format during startup. Keep an explicit backup.
      if (storage.getItem(LEGACY_BACKUP_KEY) === null) {
        storage.setItem(LEGACY_BACKUP_KEY, old);
      }
      return { document: migrated, locked: false, warning: "Projeto antigo migrado sem apagar o backup." };
    } catch {
      return {
        document: createDocument(), locked: true,
        warning: "Não foi possível migrar os dados antigos. O armazenamento foi preservado.",
      };
    }
  }
  return { document: createDocument(), locked: false, warning: null };
}
export function saveStoredDocument(storage: Pick<Storage, "setItem">, document: ProjectDocument): void {
  storage.setItem(CURRENT_STORAGE_KEY, serializeDocument(document));
}
