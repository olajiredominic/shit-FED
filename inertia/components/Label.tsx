import { severityLabelStyles } from '~/utils/label_styles'

interface LabelProps {
  label: string
}

function Label({ label }: LabelProps) {
  // Normalize label to lowercase for matching
  const normalizedLabel = label.toLowerCase().replace(/\s+/g, '')
  // Get styles based on label, fallback to default
  const styles =
    severityLabelStyles[normalizedLabel as keyof typeof severityLabelStyles] ||
    severityLabelStyles.default

  return (
    <span
      className={`inline-block ${styles.bgColor} ${styles.textColor} text-xs font-medium px-2 py-1 rounded-md border ${styles.borderColor} mr-1`}
    >
      {label}
    </span>
  )
}

export default Label