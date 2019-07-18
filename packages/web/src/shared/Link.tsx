import Link from 'next/link'
import * as React from 'react'

interface Props {
  href: string
  children: any
  prefetch?: boolean
}

export default ({ href, children, prefetch = false }: Props) => {
  return (
    <Link prefetch={prefetch} href={href}>
      {children}
    </Link>
  )
}
