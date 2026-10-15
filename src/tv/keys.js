// A TV remote's keys, as a desktop keyboard sends them.
export const BACK_KEYS = ['Escape', 'Backspace']
export const OK_KEYS = ['Enter', ' ']

// True for key presses the TV should ignore (browser shortcuts).
export const isShortcut = (e) => e.metaKey || e.ctrlKey || e.altKey
