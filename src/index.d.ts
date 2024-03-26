// @flow

import * as React from 'react'

export type State = {
  loading: boolean
  loaded: boolean
  error: Error | null | undefined
  promise: Promise<any> | null | undefined
}

export type Props = {
  href: string
  onLoad?: (() => any) | null
  onError?: ((error: Error) => any) | null
  children?: ((state: State) => React.ReactNode | null | undefined) | null
  act?: ((action: () => void) => void) | null
}

export function useLink(props: Props): State

export declare class LinksRegistry {
  links: Array<{ href: string }>
  results: { [href: string]: { error: Error | null | undefined } }
  promises: { [href: string]: Promise<any> }

  linkTags(options?: { nonce?: string }): React.ReactNode
}

export const LinksRegistryContext: React.Context<
  LinksRegistry | null | undefined
>

export default function LinkLoader(props: Props): React.ReactElement | null
