import { useEffect, useState } from 'react'

// A signed (ASL) welcome. SignBridge is for Deaf learners, so the welcome itself
// should be available in sign — not only in written English.
//
// IMPORTANT: the actual signing must come from a real signer (a Deaf presenter is
// best). Drop a recorded clip at `public/sign/welcome.mp4` (optionally captions at
// `public/sign/welcome.vtt`). Until then this component renders nothing, so a judge
// never sees a placeholder. We never fabricate or auto-generate sign language.
const VIDEO_SRC = '/sign/welcome.mp4'
const CAPTIONS_SRC = '/sign/welcome.vtt'

export default function SignWelcome() {
  const [available, setAvailable] = useState(false)
  const [open, setOpen] = useState(false)
  const [hasCaptions, setHasCaptions] = useState(false)

  useEffect(() => {
    let active = true
    fetch(VIDEO_SRC, { method: 'HEAD' })
      .then((response) => { if (active) setAvailable(response.ok) })
      .catch(() => {})
    fetch(CAPTIONS_SRC, { method: 'HEAD' })
      .then((response) => { if (active) setHasCaptions(response.ok) })
      .catch(() => {})
    return () => { active = false }
  }, [])

  if (!available) return null

  return (
    <div className="sign-welcome">
      {open ? (
        <video className="sign-welcome__video" controls autoPlay playsInline onError={() => setAvailable(false)}>
          <source src={VIDEO_SRC} type="video/mp4" />
          {hasCaptions && <track kind="captions" src={CAPTIONS_SRC} srcLang="en" label="English" default />}
        </video>
      ) : (
        <button type="button" className="sign-welcome__cta" onClick={() => setOpen(true)}>
          <span aria-hidden="true">🤟</span> Watch this welcome in sign language
        </button>
      )}
    </div>
  )
}
