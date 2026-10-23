declare module 'bibtex-parse' {
  export function parse(
    str: string,
    options?: unknown,
  ): Array<{
    itemtype: string;
    type?: string;
    key?: string;
    fields?: Array<{ name: string; value: string }>;
  }>;
}
