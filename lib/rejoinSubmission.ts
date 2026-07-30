export function createSingleFlight() {
  let running = false

  return {
    run<T>(work: () => Promise<T>): Promise<T> | null {
      if (running) return null
      running = true

      return work().finally(() => {
        running = false
      })
    },
  }
}
