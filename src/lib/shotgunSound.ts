let context: AudioContext | null = null

/** Estrondo do tiro, gerado na hora: um estalo de ruído e um grave que cai. */
export function playShotgun() {
  try {
    context ??= new AudioContext()
    const audio = context
    if (audio.state === 'suspended') void audio.resume()
    const now = audio.currentTime

    const length = Math.floor(audio.sampleRate * 0.45)
    const buffer = audio.createBuffer(1, length, audio.sampleRate)
    const samples = buffer.getChannelData(0)
    for (let i = 0; i < length; i++) samples[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3

    const noise = audio.createBufferSource()
    noise.buffer = buffer
    const filter = audio.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(5200, now)
    filter.frequency.exponentialRampToValueAtTime(420, now + 0.32)
    const noiseGain = audio.createGain()
    noiseGain.gain.setValueAtTime(0.5, now)
    noise.connect(filter).connect(noiseGain).connect(audio.destination)
    noise.start(now)

    const thump = audio.createOscillator()
    thump.frequency.setValueAtTime(130, now)
    thump.frequency.exponentialRampToValueAtTime(38, now + 0.22)
    const thumpGain = audio.createGain()
    thumpGain.gain.setValueAtTime(0.55, now)
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28)
    thump.connect(thumpGain).connect(audio.destination)
    thump.start(now)
    thump.stop(now + 0.3)
  } catch {
    // Sem som neste navegador: o tiro continua só visual.
  }
}
