import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { faceTone, hashName, NAMED_FACES } from './faceTone'
import face from './unitFace.vue?raw'

const tokens = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8')

describe('单位大头色板', () => {
  it('四人表驱动色固定', () => {
    expect(faceTone('冲冲侠')).toEqual(NAMED_FACES.冲冲侠)
    expect(faceTone('盾盾仔').kind).toBe('dome')
    expect(faceTone('炮炮龙').kind).toBe('horn')
    expect(faceTone('豆豆兵').kind).toBe('cap')
  })

  it('未知名字按哈希落到色板且稳定', () => {
    const a = faceTone('巡逻甲')
    const b = faceTone('巡逻甲')
    expect(a).toEqual(b)
    expect(hashName('巡逻甲')).toBe(hashName('巡逻甲'))
    expect(a.ring).toMatch(/^#/)
  })

  it('md 大头约 64px，壳只用渐变高光不加噪点', () => {
    expect(face).toContain('width: 64px')
    expect(face).toContain('height: 64px')
    expect(face).not.toMatch(/feTurbulence|feDiffuseLighting|fractalNoise/)
    expect(tokens).toContain('--plastic')
    expect(tokens).toContain('--gloss')
    expect(tokens).not.toMatch(/feTurbulence|noise\(|url\(['\"]?data:image/)
  })
})
