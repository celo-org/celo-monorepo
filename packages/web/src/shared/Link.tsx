import Link from 'next/link'
import * as React from 'react'

interface Props {
  href: string
  children: React.ReactNode
  prefetch?: boolean
  passHref?: boolean
}

export default ({ href, children, passHref, prefetch = false }: Props) => {
  if (href) {
    return (
      <Link prefetch={prefetch} href={href} passHref={passHref}>
        {children}
      </Link>
    )
  } else {
    return <>{children}</>
  }
}
