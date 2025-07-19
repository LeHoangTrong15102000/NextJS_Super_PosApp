describe('Simple Test', () => {
  it('should pass basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should handle basic string operations', () => {
    const str = 'Hello World'
    expect(str).toContain('Hello')
    expect(str.length).toBe(11)
  })
})
