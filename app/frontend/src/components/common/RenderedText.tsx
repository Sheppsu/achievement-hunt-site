const urlRe = new RegExp(
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
  "dgi",
);

function formatLines(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => (
    <>
      {line}
      {i === lines.length - 1 ? "" : <br />}
    </>
  ));
}

export default function RenderedText({ text }: { text: string }) {
  const matches = text.matchAll(urlRe);

  const elements = [];
  let lastI = 0;
  for (const match of matches) {
    elements.push(formatLines(text.substring(lastI, match.index)));

    const url = match[0];
    elements.push(
      <a className="rendered-text" href={url} target="_blank">
        {url}
      </a>,
    );

    lastI = match.index + url.length;
  }

  if (lastI < text.length - 1) {
    elements.push(formatLines(text.substring(lastI)));
  }

  return <>{...elements}</>;
}
