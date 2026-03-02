'use client'

import { useState, useCallback } from 'react'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import KeyboardShortcutsHelp from '@/components/keyboard-shortcuts-help'

export default function ManageKeyboardShortcuts() {
  const [helpOpen, setHelpOpen] = useState(false)

  const shortcuts = [
    {
      key: '?',
      handler: useCallback(() => setHelpOpen(true), []),
      description: 'Mở trợ giúp phím tắt'
    },
    {
      key: 'Escape',
      handler: useCallback(() => setHelpOpen(false), []),
      description: 'Đóng dialog'
    }
  ]

  useKeyboardShortcuts(shortcuts)

  return <KeyboardShortcutsHelp open={helpOpen} onOpenChange={setHelpOpen} />
}

