import '@testing-library/jest-dom'

// Mock React environment
global.React = require('react')

// Mock import.meta.glob for convex-test compatibility
if (typeof import.meta === 'undefined') {
  ;(globalThis as any).import = (globalThis as any).import || {}
  ;(globalThis as any).import.meta = (globalThis as any).import.meta || {}
}
if (!(import.meta as any).glob) {
  ;(import.meta as any).glob = () => ({})
}