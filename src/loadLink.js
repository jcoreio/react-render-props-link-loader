// @flow
/* eslint-env browser */
import { type InnerProps } from './index'

const loadLink = async ({
  linksRegistry,
  onLoad,
  onError,
  children,
  ...props
}: InnerProps): Promise<void> => {
  const { href } = props
  if (linksRegistry) {
    results[href] = { error: undefined }
    linksRegistry.links.push(props)
    return
  }
  if (typeof document === 'undefined') {
    throw new Error(
      'you must pass a linksRegistry if calling on the server side'
    )
  }
  if (typeof document.querySelector === 'function') {
    if (document.querySelector(`link[href="${href}"]`)) {
      results[href] = { error: undefined }
      return
    }
  }
  return new Promise((resolve: () => void, reject: (error?: Error) => void) => {
    const link = document.createElement('link')
    link.href = href
    Object.keys(props).forEach(key => link.setAttribute(key, props[key]))
    link.onload = resolve
    link.onerror = reject
    if (document.body) document.body.appendChild(link)
  })
}

const results: { [href: string]: { error: ?Error } } = {}
const promises: { [href: string]: Promise<any> } = {}

export default (props: InnerProps): Promise<any> =>
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
}: InnerProps): {
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
