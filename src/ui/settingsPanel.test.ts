import { describe, expect, it } from 'vitest'
import app from './app.vue?raw'
import settings from './settingsPanel.vue?raw'

describe('settings layout', () => {
  it('uses a round close mark and keeps the stats list', () => {
    expect(settings).toContain('aria-label="关闭"')
    expect(settings).toContain('border-radius: 50%')
    expect(settings).not.toContain('>关闭</button>')
    expect(settings).toContain('待命 {{ stats.camp }}')
    expect(settings).toContain('出征 {{ stats.marching }}')
    expect(settings).toContain('押回 {{ stats.captives }}')
    expect(settings).toContain('医院占床 {{ stats.hospitalBeds }}')
    expect(settings).toContain('医院排队 {{ stats.hospitalQueue }}')
    expect(settings).toContain('餐厅占座 {{ stats.restaurantSeats }}')
    expect(settings).toContain('餐厅排队 {{ stats.restaurantQueue }}')
    expect(settings).toContain('床数 {{ stats.bedCount }}')
    expect(settings).toContain('桌数 {{ stats.tableCount }}')
    expect(settings).toContain('补给 {{ stats.supply }}')
    expect(settings).toContain('药剂 {{ stats.potionCount }}')
    expect(settings).toContain('货架合计 {{ stats.shelfTotal }}')
    expect(settings).toContain('材料栏 {{ stats.kitchenCount }}')
  })

  it('puts the install card and audio switches on the general page', () => {
    const general = settings.indexOf("page === 'general'")
    const install = settings.indexOf('class="install-card"')
    const music = settings.indexOf('>音乐<')
    const sfx = settings.indexOf('>音效<')
    const version = settings.indexOf("page === 'version'")
    expect(general).toBeGreaterThan(0)
    expect(install).toBeGreaterThan(general)
    expect(music).toBeGreaterThan(install)
    expect(sfx).toBeGreaterThan(music)
    expect(version).toBeGreaterThan(sfx)
    expect(settings).toContain('像 App 一样全屏打开')
    expect(settings).toContain("addToHomeChoiceNow !== 'hidden'")
    expect(settings).not.toContain('工坊闲话')
  })

  it('keeps a single version action and groups the GM buttons', () => {
    expect(settings).toContain('class="ver-card"')
    expect(settings).toContain('class="refresh wide"')
    expect(settings).toContain('<button v-else type="button" class="wide"')
    const labels = ['初始化', '加补给 +50', '加药 +5', '货架三种各 +5', '发粗料', '全员回营']
    const at = labels.map((label) => settings.indexOf(label))
    expect(at.every((index) => index > 0)).toBe(true)
    expect([...at].sort((a, b) => a - b)).toEqual(at)
    expect(settings).toContain('class="gm-grid"')
    expect(settings).toContain('resetAsk')
    expect(settings).toContain('confirmReset')
    expect(settings).toContain('初始化会重开存档。')
    expect(settings).toContain("ev.key !== 'Escape'")
  })

  it('puts the gear on the HUD next to resource pills', () => {
    expect(app).toContain('class="gear"')
    expect(app).toContain("updateReady ? '设置，有新版本' : '设置'")
    expect(app).toContain('<SettingsPanel')
    expect(app).toContain('v-if="updateReady"')
  })
})
