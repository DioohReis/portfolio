/**
 * Chiado de TV gerado pelo navegador (ruído branco filtrado), sem arquivo de áudio.
 * Só pode tocar depois de um clique, por regra dos navegadores.
 */
export function playHiss({ volume = 0.09, duration = 2.6 } = {}) {
  try {
    const AudioCtx =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioCtx()
    const length = ctx.sampleRate * 2
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const channel = buffer.getChannelData(0)
    for (let i = 0; i < length; i++) channel[i] = Math.random() * 2 - 1

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true

    const highpass = ctx.createBiquadFilter()
    highpass.type = 'highpass'
    highpass.frequency.value = 1200

    const gain = ctx.createGain()
    const t = ctx.currentTime
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(volume, t + 0.05)
    gain.gain.setValueAtTime(volume, t + 0.9)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration)

    source.connect(highpass).connect(gain).connect(ctx.destination)
    source.start()
    source.stop(t + duration + 0.1)
    source.onended = () => void ctx.close()
  } catch {
    /* sem áudio disponível: segue em silêncio */
  }
}
