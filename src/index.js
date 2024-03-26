// @flow

import * as React from 'react'
import loadLink, { getState } from './loadLink'

export type State = {|
  loading: boolean,
  loaded: boolean,
  error: ?Error,
  promise: ?Promise<any>,
|}

export type Props = {
  href: string,
  onLoad?: ?() => any,
  onError?: ?(error: Error) => any,
  children?: ?(state: State) => ?React.Node,
  act?: ?(action: () => void) => void,
  ...
}

export type InnerProps = {
  ...$Exact<Props>,
  linksRegistry?: ?LinksRegistry,
  ...
}

export function useLink(props: Props): State {
  const isMounted = React.useRef(true)
  React.useEffect(
    () => () => {
      isMounted.current = false
    },
    []
  )

  const linksRegistry = React.useContext(LinksRegistryContext)

  const [, rerender] = React.useReducer((count = 0) => count + 1)
  const propsRef = React.useRef(props)
  propsRef.current = props

  const act = React.useCallback((fn: () => void) => {
    if (!isMounted.current) return
    const { act } = propsRef.current
    if (act) act(fn)
    else fn()
  }, [])

  const promise = React.useMemo(
    () => loadLink({ ...props, linksRegistry }),
    [props.href, linksRegistry]
  )

  React.useEffect(() => {
    if (!isMounted.current) return
    promise.then(
      () =>
        act(() => {
          propsRef.current.onLoad?.()
          rerender()
        }),
      (error: Error) =>
        act(() => {
          propsRef.current.onError?.(error)
          rerender()
        })
    )
  }, [promise])

  return getState({ ...props, linksRegistry })
}

export class LinksRegistry {
  links: Array<{ href: string, ... }> = []
  results: { [href: string]: { error: ?Error } } = {}
  promises: { [href: string]: Promise<any> } = {}

  linkTags(options?: {| nonce?: string |}): React.Node {
    return this.links.map((props) => (
      <link
        {...props}
        key={props.href}
        nonce={options ? options.nonce : undefined}
      />
    ))
  }
}

export const LinksRegistryContext: React.Context<?LinksRegistry> =
  React.createContext(null)

export default function LinkLoader(props: Props): React.Node | null {
  const state = useLink(props)
  const { children } = props
  if (children) {
    const result = children({ ...state })
    return result == null ? null : result
  }
  return null
}
