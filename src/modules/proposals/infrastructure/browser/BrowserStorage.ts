export class BrowserStorage {
  public read(key: string): string | null {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage.getItem(key);
  }

  public write(key: string, value: string): void {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(key, value);
  }
}
