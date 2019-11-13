export default function withHash<T>(Component: React.ComponentType<T>) {
  return function WithHashContainer(props: any) {
    return (
      <WithHash>
        {({ routeHash }) => {
          return <Component routeHash={routeHash} {...props} />
        }}
      </WithHash>
    )
  }
}

class WithHash extends React.Component {
  render
}
