export type DocumentPreviewDoc = {
  html: string;
  title: string;
  filename: string;
};

type Listener = (docs: DocumentPreviewDoc[]) => void;

let listener: Listener | null = null;

export function subscribeDocumentPreview(fn: Listener): () => void {
  listener = fn;
  return () => {
    if (listener === fn) listener = null;
  };
}

/** Open the global print-preview modal (registered from App). */
export function openDocumentPreview(docs: DocumentPreviewDoc | DocumentPreviewDoc[]): void {
  const list = Array.isArray(docs) ? docs : [docs];
  listener?.(list);
}
