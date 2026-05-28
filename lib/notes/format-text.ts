export function wrapTextareaSelection(
  textarea: HTMLTextAreaElement,
  before: string,
  after: string = before,
): string {
  const { selectionStart, selectionEnd, value } = textarea;
  const selected = value.slice(selectionStart, selectionEnd);
  const next =
    value.slice(0, selectionStart) +
    before +
    selected +
    after +
    value.slice(selectionEnd);
  return next;
}

export function prefixTextareaLines(
  textarea: HTMLTextAreaElement,
  prefix: string,
): string {
  const { selectionStart, selectionEnd, value } = textarea;
  const start = value.lastIndexOf("\n", selectionStart - 1) + 1;
  const end = value.indexOf("\n", selectionEnd);
  const blockEnd = end === -1 ? value.length : end;
  const block = value.slice(start, blockEnd);
  const prefixed = block
    .split("\n")
    .map((line) => (line.length ? `${prefix}${line}` : line))
    .join("\n");
  return value.slice(0, start) + prefixed + value.slice(blockEnd);
}
