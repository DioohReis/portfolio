/**
 * Estalos de fogueira gerados pelo navegador (estalos curtos sobre um ruído grave), sem arquivo de áudio.
 * Só toca depois de um clique no site, por regra dos navegadores; o clique da TV já cumpre isso.
 */
export function playCrackle({ volume = 0.12, duration = 1.8 } = {}) {
  try {
    const AudioCtx =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioCtx()
    const length = Math.floor(ctx.sampleRate * duration)
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const channel = buffer.getChannelData(0)

    let rumble = 0
    for (let i = 0; i < length; i++) {
      rumble += (Math.random() * 2 - 1 - rumble) * 0.02
      channel[i] = rumble * 0.6
    }
    for (let pop = 0; pop < 26; pop++) {
      const start = Math.floor(Math.random() * (length - 800))
      const strength = 0.25 + Math.random() * 0.75
      for (let i = 0; i < 700; i++) channel[start + i] += (Math.random() * 2 - 1) * strength * Math.exp(-i / 90)
    }

    const source = ctx.createBufferSource()
    source.buffer = buffer

    const gain = ctx.createGain()
    const t = ctx.currentTime
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(volume, t + 0.12)
    gain.gain.setValueAtTime(volume, t + duration * 0.6)
    gain.gain.linearRampToValueAtTime(0, t + duration)

    source.connect(gain).connect(ctx.destination)
    source.start()
    source.onended = () => void ctx.close()
  } catch {
    /* sem áudio disponível: segue em silêncio */
  }
}
