export type ColumnRole =
  | 'account'
  | 'campaign'
  | 'group'
  | 'ad'
  | 'term'
  | 'type'
  | 'impr'
  | 'clicks'
  | 'cost'
  | 'conv'
  | 'val'
  | 'is'
  | 'lost_b'
  | 'lost_r'

export type ColumnMap = Partial<Record<ColumnRole, string>>
