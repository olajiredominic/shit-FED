import { useEffect, useState } from 'react'

interface UseIntersectionObserverOptions {
  onIntersect: () => void
  enabled?: boolean
  rootMargin?: string
  threshold?: number
  root?: Element | null
}

export function useIntersectionObserver({
  onIntersect,
  enabled = true,
  rootMargin = '100px',
  threshold = 0.1,
  root = null,
}: UseIntersectionObserverOptions) {
  const [element, setElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!enabled || !element) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          console.log("Intersected")
          onIntersect()
        }
      },
      { root, rootMargin, threshold }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [element, onIntersect, enabled, root, rootMargin, threshold])

  // Return setter to assign ref on element
  return { ref: setElement }
}
