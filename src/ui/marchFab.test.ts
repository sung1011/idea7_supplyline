import { describe, expect, it } from 'vitest'
import app from './app.vue?raw'
import camp from './campPage.vue?raw'
import fab from './marchFab.vue?raw'

describe('底部出征圆钮', () => {
  it('壳层三区常显队首 FAB，底栏给圆钮留槽', () => {
    expect(app).toContain('<MarchFab')
    expect(app).toContain('class="tab-slot"')
    expect(app).toContain('grid-template-columns: minmax(0, 1fr) var(--march-fab-slot) minmax(0, 1fr)')
    expect(app).toContain('pointer-events: none')
    expect(app.indexOf('<CampPage')).toBeLessThan(app.indexOf('<MarchFab'))
    expect(app.indexOf('<HospitalPage')).toBeLessThan(app.indexOf('<MarchFab'))
    expect(app.indexOf('<RestaurantPage')).toBeLessThan(app.indexOf('<MarchFab'))
  })

  it('圆钮复用 UnitFace，无人待命虚线空脸，点击出征队首', () => {
    expect(fab).toContain('UnitFace')
    expect(fab).toContain(':general-id="campLeader.generalId"')
    expect(fab).toContain('class="empty-face"')
    expect(fab).toContain('border: 4px dashed var(--stroke)')
    expect(fab).toContain(':disabled="!campLeaderReady"')
    expect(fab).toContain('store.marchCampLeader()')
    expect(fab).toContain('border-radius: 50%')
    expect(fab).toContain('inset 0 1px 0')
  })

  it('营地卡上逐人出征按钮仍保留', () => {
    expect(camp).toContain('store.marchUnit(unit.id)')
    expect(camp).toContain(':disabled="!store.marchReady(unit.id)"')
    expect(camp).toContain('出征')
  })
})
