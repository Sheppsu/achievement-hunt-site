export default function UpArrow(className = "") {
  return (
    <svg className={className} viewBox="0 0 1 1">
      <polyline
        points="0.1,0.7 0.5,0.3 0.9,0.7 "
        fill="none"
        stroke="black"
        strokeWidth={0.1}
      />
    </svg>
  );
}
