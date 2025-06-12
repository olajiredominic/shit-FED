import { useState, useCallback, useEffect } from "react"

export function useTruncationCheck(
  contentRef: React.RefObject<HTMLElement | null>,
  dependency: any
) {
  const [isTruncated, setIsTruncated] = useState(false)

  const checkTruncation = useCallback(() => {
    if (contentRef.current) {
      contentRef.current.style.webkitLineClamp = 'unset'
      contentRef.current.style.display = 'block'
      const fullHeight = contentRef.current.scrollHeight

      contentRef.current.style.webkitLineClamp = '3'
      contentRef.current.style.display = '-webkit-box'
      const clampedHeight = contentRef.current.clientHeight

      setIsTruncated(fullHeight > clampedHeight)
    }
  }, [contentRef])

  useEffect(() => {
    const timer = setTimeout(checkTruncation, 10)
    window.addEventListener('resize', checkTruncation)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', checkTruncation)
    }
  }, [checkTruncation, dependency])

  return isTruncated
}
