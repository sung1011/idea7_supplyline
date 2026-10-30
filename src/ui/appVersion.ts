/** 构建时写入的版本。`version` 是 git 短哈希；没有提交记录时是 `dev`。 */
export type AppVersionInfo = {
  version: string
  /** 完整提交哈希。旧构建可能没有。 */
  sha?: string
  /** ISO 时间。没有记录时是空串。 */
  releasedAt: string
  notes: AppVersionNote[]
}

export type AppVersionNote = {
  at: string
  /** git 提交标题的第一行。 */
  title: string
}
