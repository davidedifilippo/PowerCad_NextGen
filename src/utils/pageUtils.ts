import { Doc, SheetPage, Element, Wire } from '../model/types';

/**
 * Returns the array of pages from a Doc.
 * If doc.pages is undefined or empty, returns a default single page containing doc.elements and doc.wires.
 */
export function getDocPages(doc: Doc): SheetPage[] {
  if (doc.pages && doc.pages.length > 0) {
    return doc.pages;
  }
  return [
    {
      id: 'page_1',
      title: doc.sheet.title || 'Foglio 1',
      elements: doc.elements || [],
      wires: doc.wires || [],
    },
  ];
}

/**
 * Returns the currently active page index, clamped to the valid range.
 */
export function getActivePageIndex(doc: Doc): number {
  const pages = getDocPages(doc);
  const idx = doc.activePageIndex ?? 0;
  if (idx < 0) return 0;
  if (idx >= pages.length) return Math.max(0, pages.length - 1);
  return idx;
}

/**
 * Ensures doc.pages is populated and matches doc.elements and doc.wires for the active page.
 */
export function normalizeDocWithPages(doc: Doc): Doc {
  const pages = getDocPages(doc);
  const activeIdx = getActivePageIndex(doc);

  const updatedPages = pages.map((page, idx) => {
    if (idx === activeIdx) {
      return {
        ...page,
        elements: doc.elements,
        wires: doc.wires,
      };
    }
    return page;
  });

  return {
    ...doc,
    pages: updatedPages,
    activePageIndex: activeIdx,
  };
}

/**
 * Updates the elements and wires of the active page and keeps doc.pages in sync.
 */
export function updateDocContent(
  doc: Doc,
  elements: Element[],
  wires: Wire[]
): Doc {
  const pages = getDocPages(doc);
  const activeIdx = getActivePageIndex(doc);

  const updatedPages = pages.map((page, idx) => {
    if (idx === activeIdx) {
      return {
        ...page,
        elements,
        wires,
      };
    }
    return page;
  });

  return {
    ...doc,
    elements,
    wires,
    pages: updatedPages,
    activePageIndex: activeIdx,
  };
}

/**
 * Switches the active page to targetIndex.
 * Synchronizes current elements and wires into the current page before switching.
 */
export function switchPage(doc: Doc, targetIndex: number): Doc {
  const pages = getDocPages(doc);
  const currentIdx = getActivePageIndex(doc);

  if (targetIndex < 0 || targetIndex >= pages.length || targetIndex === currentIdx) {
    return doc;
  }

  // Save current elements & wires to current page
  const updatedPages = pages.map((p, idx) =>
    idx === currentIdx ? { ...p, elements: doc.elements, wires: doc.wires } : p
  );

  const targetPage = updatedPages[targetIndex];

  return {
    ...doc,
    elements: targetPage.elements,
    wires: targetPage.wires,
    pages: updatedPages,
    activePageIndex: targetIndex,
  };
}

/**
 * Adds a new page and activates it.
 */
export function addPage(doc: Doc, title?: string): Doc {
  const pages = getDocPages(doc);
  const currentIdx = getActivePageIndex(doc);

  // Save current page state
  const updatedPages = pages.map((p, idx) =>
    idx === currentIdx ? { ...p, elements: doc.elements, wires: doc.wires } : p
  );

  const newPageIndex = updatedPages.length;
  const newTitle = title || `Foglio ${newPageIndex + 1}`;
  const newPage: SheetPage = {
    id: `page_${Date.now()}_${newPageIndex + 1}`,
    title: newTitle,
    elements: [],
    wires: [],
  };

  const allPages = [...updatedPages, newPage];

  return {
    ...doc,
    elements: [],
    wires: [],
    pages: allPages,
    activePageIndex: newPageIndex,
  };
}

/**
 * Deletes a page at pageIndex. Does nothing if there is only 1 page.
 */
export function deletePage(doc: Doc, pageIndex: number): Doc {
  const pages = getDocPages(doc);
  if (pages.length <= 1) return doc;

  const currentIdx = getActivePageIndex(doc);
  // Sync current content first
  const syncedPages = pages.map((p, idx) =>
    idx === currentIdx ? { ...p, elements: doc.elements, wires: doc.wires } : p
  );

  const newPages = syncedPages.filter((_, idx) => idx !== pageIndex);
  let nextActiveIdx = currentIdx;
  if (pageIndex === currentIdx) {
    nextActiveIdx = Math.min(pageIndex, newPages.length - 1);
  } else if (pageIndex < currentIdx) {
    nextActiveIdx = currentIdx - 1;
  }

  const activePage = newPages[nextActiveIdx];

  return {
    ...doc,
    elements: activePage.elements,
    wires: activePage.wires,
    pages: newPages,
    activePageIndex: nextActiveIdx,
  };
}

/**
 * Renames a page at pageIndex.
 */
export function renamePage(doc: Doc, pageIndex: number, newTitle: string): Doc {
  const pages = getDocPages(doc);
  const updatedPages = pages.map((p, idx) =>
    idx === pageIndex ? { ...p, title: newTitle } : p
  );

  return {
    ...doc,
    pages: updatedPages,
  };
}
