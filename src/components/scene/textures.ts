// Small textures drawn on a canvas at runtime: no image files to download, and they stay sharp at any size.
import * as THREE from 'three'
import { COLORS } from './materials'

const FONT = '"Anek Latin Variable", "Anek Latin", system-ui, sans-serif'

function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')
  if (g) draw(g)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath()
  g.roundRect(x, y, w, h, r)
}

/** The "Job done" ticket that slides out of the letterbox. */
export function ticketTexture(onChange?: () => void): THREE.CanvasTexture {
  // The header carries the official logo; it is drawn once the image has loaded.
  const logo = new Image()
  const draw = (g: CanvasRenderingContext2D) => {
    g.fillStyle = '#FFFFFF'
    g.fillRect(0, 0, 512, 720)
    const grad = g.createLinearGradient(0, 0, 512, 0)
    grad.addColorStop(0, COLORS.royal)
    grad.addColorStop(1, COLORS.cobalt)
    g.fillStyle = grad
    g.fillRect(0, 0, 512, 150)
    if (logo.complete && logo.naturalWidth > 0) g.drawImage(logo, 40, 39, 72, 72)
    g.fillStyle = '#FFFFFF'
    g.font = `700 50px ${FONT}`
    g.fillText('Housefi', 128, 94)
    g.font = `500 26px ${FONT}`
    g.globalAlpha = 0.8
    g.fillText('Visit summary', 320, 92)
    g.globalAlpha = 1
    // Check badge
    g.fillStyle = '#E7F8EF'
    g.beginPath()
    g.arc(256, 268, 74, 0, Math.PI * 2)
    g.fill()
    g.strokeStyle = '#22A05B'
    g.lineWidth = 18
    g.lineCap = 'round'
    g.lineJoin = 'round'
    g.beginPath()
    g.moveTo(218, 270)
    g.lineTo(246, 298)
    g.lineTo(298, 240)
    g.stroke()
    g.fillStyle = COLORS.ink
    g.font = `700 52px ${FONT}`
    g.textAlign = 'center'
    g.fillText('Job done', 256, 412)
    g.font = `500 26px ${FONT}`
    g.fillStyle = '#5B6276'
    g.fillText('Quote approved · Work complete', 256, 456)
    g.textAlign = 'left'
    // Placeholder lines (no invented amounts)
    g.fillStyle = '#E8ECF6'
    for (let i = 0; i < 3; i++) {
      roundRect(g, 44, 512 + i * 52, 260 - i * 50, 22, 11)
      g.fill()
      roundRect(g, 380, 512 + i * 52, 88, 22, 11)
      g.fill()
    }
    g.setLineDash([10, 10])
    g.strokeStyle = '#D5DBEA'
    g.lineWidth = 3
    g.beginPath()
    g.moveTo(30, 488)
    g.lineTo(482, 488)
    g.stroke()
  }
  const texture = canvasTexture(512, 720, draw)
  logo.onload = () => {
    const g = (texture.image as HTMLCanvasElement).getContext('2d')
    if (!g) return
    draw(g)
    texture.needsUpdate = true
    onChange?.()
  }
  logo.src = '/brand/housefi-logo-256.webp'
  return texture
}

/** Wood grain for the carpentry plank. */
export function woodTexture(): THREE.CanvasTexture {
  const t = canvasTexture(512, 256, (g) => {
    g.fillStyle = COLORS.wood
    g.fillRect(0, 0, 512, 256)
    for (let i = 0; i < 26; i++) {
      const y = (i / 26) * 256 + Math.sin(i * 1.7) * 6
      g.strokeStyle = i % 3 === 0 ? 'rgba(120,70,30,0.35)' : 'rgba(255,220,170,0.18)'
      g.lineWidth = 2 + (i % 4)
      g.beginPath()
      g.moveTo(0, y)
      for (let x = 0; x <= 512; x += 32) g.lineTo(x, y + Math.sin(x / 60 + i) * 5)
      g.stroke()
    }
  })
  t.wrapS = THREE.RepeatWrapping
  return t
}

/** Soft vertical fade for the AC's air ribbons and the glass highlight. */
export function fadeTexture(stops: readonly [number, string][], horizontal = true): THREE.CanvasTexture {
  const t = canvasTexture(horizontal ? 256 : 4, horizontal ? 4 : 256, (g) => {
    const grad = horizontal ? g.createLinearGradient(0, 0, 256, 0) : g.createLinearGradient(0, 0, 0, 256)
    for (const [o, c] of stops) grad.addColorStop(o, c)
    g.fillStyle = grad
    g.fillRect(0, 0, 256, 256)
  })
  t.wrapS = THREE.RepeatWrapping
  t.wrapT = THREE.RepeatWrapping
  return t
}
