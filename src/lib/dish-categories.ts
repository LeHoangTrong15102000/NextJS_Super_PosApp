import { DishListResType } from '@/schemaValidations/dish.schema'

type DishItem = DishListResType['data'][0]

interface CategoryMapping {
  name: string
  keywords: string[]
}

const CATEGORY_MAPPINGS: CategoryMapping[] = [
  { name: 'Bún/Phở', keywords: ['phở', 'pho', 'bún', 'bun', 'miến', 'mien', 'hủ tiếu', 'hu tieu'] },
  { name: 'Cơm', keywords: ['cơm', 'com'] },
  { name: 'Bánh', keywords: ['bánh', 'banh'] },
  { name: 'Gỏi/Salad', keywords: ['gỏi', 'goi', 'salad', 'nộm', 'nom'] },
  { name: 'Hải sản', keywords: ['tôm', 'tom', 'cua', 'mực', 'muc', 'cá', 'ca ', 'hải sản', 'hai san', 'nghêu', 'ngao', 'sò'] },
  { name: 'Thịt', keywords: ['thịt', 'thit', 'sườn', 'suon', 'bò', 'bo ', 'gà', 'ga ', 'heo', 'lợn'] },
  { name: 'Đồ uống', keywords: ['nước', 'nuoc', 'trà', 'tra ', 'cà phê', 'ca phe', 'sinh tố', 'sinh to', 'bia', 'rượu', 'ruou', 'cocktail', 'juice'] },
  { name: 'Tráng miệng', keywords: ['chè', 'che ', 'kem', 'flan', 'pudding', 'tráng miệng', 'trang mieng'] }
]

export function getDishCategory(dish: DishItem): string {
  const text = `${dish.name} ${dish.description}`.toLowerCase()
  for (const mapping of CATEGORY_MAPPINGS) {
    if (mapping.keywords.some((kw) => text.includes(kw))) {
      return mapping.name
    }
  }
  return 'Khác'
}

export function getDishCategories(dishes: DishItem[]): string[] {
  const categorySet = new Set<string>()
  dishes.forEach((dish) => categorySet.add(getDishCategory(dish)))
  const ordered = CATEGORY_MAPPINGS.map((m) => m.name).filter((name) => categorySet.has(name))
  if (categorySet.has('Khác')) ordered.push('Khác')
  return ordered
}

export function filterDishesByCategory(dishes: DishItem[], category: string | null): DishItem[] {
  if (!category || category === 'Tất cả') return dishes
  return dishes.filter((dish) => getDishCategory(dish) === category)
}

