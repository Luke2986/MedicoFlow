export function highlightMatch(
  text: string,
  indices: readonly [number, number][] | undefined
): React.ReactNode {
  if (!text) return '';
  if (!indices || indices.length === 0) {
    return text;
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  const sortedIndices = [...indices].sort((a, b) => a[0] - b[0]);

  sortedIndices.forEach(([start, end], idx) => {
    if (start > lastIndex) {
      parts.push(
        <span key={`normal-${idx}`}>{text.slice(lastIndex, start)}</span>
      );
    }

    parts.push(
      <span 
        key={`highlight-${idx}`} 
        className="bg-yellow-200 dark:bg-yellow-900 font-semibold text-gray-900 dark:text-gray-100"
      >
        {text.slice(start, end + 1)}
      </span>
    );

    lastIndex = end + 1;
  });

  if (lastIndex < text.length) {
    parts.push(
      <span key="normal-end">{text.slice(lastIndex)}</span>
    );
  }

  return <>{parts}</>;
}
