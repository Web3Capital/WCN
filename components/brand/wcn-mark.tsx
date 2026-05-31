/**
 * WCNMark — the official W³ mark (VS-04), used straight from the Visual System
 * asset: `WCN/Design-System/Visual-System/assets/wcn-mark-w3-512.png`, copied to
 * `/public/wcn-mark-w3.png`. White serif W + superscript 3 on the Ink square.
 * The rounded corner (≈ side/6) is clipped in CSS. Identity only — header/footer.
 */
type Props = {
  /** Side length in px. */
  size?: number;
  /** Accessible label; omit to treat as decorative. */
  label?: string;
  className?: string;
};

export function WCNMark({ size = 28, label, className }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/wcn-mark-w3.png"
      width={size}
      height={size}
      alt={label ?? ""}
      aria-hidden={label ? undefined : true}
      draggable={false}
      className={`wcn-mark${className ? ` ${className}` : ""}`}
      style={{ width: `${size}px`, height: `${size}px`, borderRadius: `${(size / 6).toFixed(1)}px` }}
    />
  );
}
