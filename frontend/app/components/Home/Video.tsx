export default function VideoPlay() {
  return (
    <video
      className="w-full h-full object-cover"
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      aria-label="AssetHub platform demo"
    >
      <source src="/vid/vidBlue.mp4" type="video/mp4" />

      Your browser does not support the video tag.
    </video>
  );
}