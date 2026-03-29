export interface CourseColor {
  block: string   // calendar block bg + text
  chip: string    // chip bg + text
  border: string  // border color
}

export const COURSE_COLORS: CourseColor[] = [
  { block: 'bg-indigo-100 text-indigo-800 border-indigo-300',   chip: 'bg-indigo-100 text-indigo-700',   border: 'border-indigo-400' },
  { block: 'bg-emerald-100 text-emerald-800 border-emerald-300', chip: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-400' },
  { block: 'bg-amber-100 text-amber-800 border-amber-300',       chip: 'bg-amber-100 text-amber-700',     border: 'border-amber-400' },
  { block: 'bg-rose-100 text-rose-800 border-rose-300',         chip: 'bg-rose-100 text-rose-700',       border: 'border-rose-400' },
  { block: 'bg-violet-100 text-violet-800 border-violet-300',   chip: 'bg-violet-100 text-violet-700',   border: 'border-violet-400' },
  { block: 'bg-cyan-100 text-cyan-800 border-cyan-300',         chip: 'bg-cyan-100 text-cyan-700',       border: 'border-cyan-400' },
  { block: 'bg-orange-100 text-orange-800 border-orange-300',   chip: 'bg-orange-100 text-orange-700',   border: 'border-orange-400' },
  { block: 'bg-teal-100 text-teal-800 border-teal-300',         chip: 'bg-teal-100 text-teal-700',       border: 'border-teal-400' },
]
