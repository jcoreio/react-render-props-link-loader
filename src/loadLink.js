// @flow
/* eslint-env browser */
import { type InnerProps } from './index'

let nonce: ?string
function getNonce(): string | null {
  if (nonce === undefined) {
    const node = document.querySelector(
      'meta[property="csp-nonce"], meta[name="csp-nonce"]'
    )
    nonce = node ? node.getAttribute('content') ?? null : null
  }
  return nonce ?? null
}

const loadLink = async ({
  linksRegistry,
  onLoad,
  onError,
  children,
  ...props
}: InnerProps): Promise<void> => {
  const { href } = props
  if (linksRegistry) {
    linksRegistry.results[href] = { error: undefined }
    linksRegistry.links.push(props)
    return
  }
  if (typeof document === 'undefined') {
    throw new Error(
      'you must pass a linksRegistry if calling on the server side'
    )
  }
  if (typeof (document: any).querySelector === 'function') {
    if (document.querySelector(`link[href="${href}"]`)) {
      results[href] = { error: undefined }
      return
    }
  }
  return new Promise((resolve: () => void, reject: (error?: Error) => void) => {
    const link = document.createElement('link')
    link.href = href
    ;(link: any).nonce = getNonce()
    Object.keys(props).forEach((key) => link.setAttribute(key, props[key]))
    link.onload = resolve
    link.onerror = reject
    if (document.head) document.head.appendChild(link)
  })
}

const results: { [href: string]: { error: ?Error } } = {}
const promises: { [href: string]: Promise<any> } = {}

export default (props: InnerProps): Promise<any> => {
  const { linksRegistry } = props
  const _promises = linksRegistry ? linksRegistry.promises : promises
  const _results = linksRegistry ? linksRegistry.results : results
  return (
    _promises[props.href] ||
    (_promises[props.href] = loadLink(props).then(
      () => (_results[props.href] = { error: null }),
      (error: any = new Error(`failed to load ${props.href}`)) => {
        _results[props.href] = { error }
        throw error
      }
    ))
  )
}

export function getState({ href, linksRegistry }: InnerProps): {
  loading: boolean,
  loaded: boolean,
  error: ?Error,
  promise: ?Promise<any>,
} {
  const result = linksRegistry ? linksRegistry.results[href] : results[href]
  const promise = linksRegistry ? linksRegistry.promises[href] : promises[href]
  return {
    loading: result == null,
    loaded: result ? !result.error : false,
    error: result && result.error,
    promise,
  }
}
