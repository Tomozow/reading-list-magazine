declare namespace chrome {
  namespace readingList {
    interface ReadingListEntry {
      id: string;
      url: string;
      title: string;
      addTime: number;
      lastUpdateTime?: number;
    }

    interface ReadingListEventListener<T> {
      addListener: (callback: (arg: T) => void) => void;
      removeListener: (callback: (arg: T) => void) => void;
      hasListener: (callback: (arg: T) => void) => boolean;
    }

    interface ReadingListEntryFilter {
      url?: string;
      title?: string;
    }

    const onEntryAdded: ReadingListEventListener<ReadingListEntry>;
    const onEntryDeleted: ReadingListEventListener<string>;
    const onEntryUpdated: ReadingListEventListener<ReadingListEntry>;

    function query(filter?: ReadingListEntryFilter): Promise<ReadingListEntry[]>;
    function addEntry(params: { url: string, title: string }): Promise<string>;
    function removeEntry(id: string): Promise<void>;
    function updateEntry(id: string, params: { title?: string, url?: string }): Promise<void>;
  }
}
