'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ApiSection, ApiCourse } from '@/types/purdue'

export interface SelectedSection extends ApiSection {
  courseId: string
  courseLabel: string // e.g. "CS 18200"
  courseTitle: string
  colorIndex: number
}

interface ScheduleStore {
  semesterId: string
  selectedSections: SelectedSection[]
  setSemester: (id: string) => void
  addSection: (section: ApiSection, course: ApiCourse, colorIndex: number) => void
  removeSection: (sectionId: string) => void
  clearSchedule: () => void
  isSelected: (sectionId: string) => boolean
}

export const useScheduleStore = create<ScheduleStore>()(
  persist(
    (set, get) => ({
      semesterId: '',
      selectedSections: [],

      setSemester: (id) => set({ semesterId: id, selectedSections: [] }),

      addSection: (section, course, colorIndex) => {
        if (get().isSelected(section.id)) return
        set((state) => ({
          selectedSections: [
            ...state.selectedSections,
            {
              ...section,
              courseId: course.id,
              courseLabel: `${course.subject} ${course.number}`,
              courseTitle: course.title,
              colorIndex,
            },
          ],
        }))
      },

      removeSection: (sectionId) =>
        set((state) => ({
          selectedSections: state.selectedSections.filter((s) => s.id !== sectionId),
        })),

      clearSchedule: () => set({ selectedSections: [] }),

      isSelected: (sectionId) => get().selectedSections.some((s) => s.id === sectionId),
    }),
    { name: 'purdue-schedule' }
  )
)
