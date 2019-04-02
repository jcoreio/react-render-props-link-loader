// @flow

/* eslint-env browser */

type Props = {
  href: string,
}

const loadLink = ({ href, ...props }: Props): Promise<void> =>
  new Promise((resolve: () => void, reject: (error?: Error) => void) => {
    if (typeof document === 'undefined') {
      reject(new Error('server-side rendering is not supported'))
      return
    }
    if (typeof document.querySelector === 'function') {
      if (document.querySelector(`link[href="${href}"]`)) {
        resolve()
        return
      }
    }
    const link = document.createElement('link')
    link.href = href
    Object.keys(props).forEach(key => link.setAttribute(key, props[key]))
    link.onload = resolve
    link.onerror = reject
    if (document.body) document.body.appendChild(link)
  })

const results: { [href: string]: { error: ?Error } } = {}
const promises: { [href: string]: Promise<any> } = {}

export default (props: Props): Promise<any> =>
  promises[props.href] ||
  (promises[props.href] = loadLink(props).then(
    () => (results[props.href] = { error: null }),
    (error: any = new Error(`failed to load ${props.href}`)) => {
      results[props.href] = { error }
      throw error
    }
  ))

export function getState({
  href,
}: Props): {
  loading: boolean,
  loaded: boolean,
  error: ?Error,
  promise: ?Promise<any>,
} {
  const result = results[href]
  return {
    loading: result == null,
    loaded: result ? !result.error : false,
    error: result && result.error,
    promise: promises[href],
  }
}
