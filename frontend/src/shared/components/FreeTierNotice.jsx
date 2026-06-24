// Shown whenever the live model is unavailable and SignBridge falls back to
// reviewed lessons. It explains the free-tier trade-off to anyone testing the
// app (e.g. judges) so a rate-limit pause never reads as a broken product.
export function FreeTierNotice() {
  return (
    <div className="notice notice--info" role="status">
      <strong>Free-tier AI in use</strong>
      SignBridge runs on Google Gemini's <b>free tier</b>, so it deploys anywhere at zero cost. The trade-off is strict rate limits — under heavy testing the live model pauses and SignBridge uses reviewed offline lessons instead (your progress still counts). A paid key gives faster, higher-quality, unlimited responses.
    </div>
  )
}
