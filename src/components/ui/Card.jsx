import { cn } from '../../utils/cn'

function Card({ as: Tag = 'div', className, children, ...rest }) {
  return (
    <Tag
      className={cn(
        'rounded-xl border border-line bg-surface',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export default Card
