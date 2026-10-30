import { describe, expect, it } from 'vitest'
import { GAME_NAME } from './placeholder'

describe('placeholder', () => {
  it('exposes the game name', () => {
    expect(GAME_NAME).toBe('补给线')
  })
})
