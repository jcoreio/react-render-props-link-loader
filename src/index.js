// @flow

import * as React from 'react'
import loadLink, { getState } from './loadLink'
import PropTypes from 'prop-types'

export type State = {
  loading: boolean,
  loaded: boolean,
  error: ?Error,
  promise: ?Promise<any>,
}

export type Props = {
  href: string,
  onLoad?: ?() => any,
  onError?: ?(error: Error) => any,
  children?: ?(state: State) => ?React.Node,
}

export type InnerProps = Props & {
  linksRegistry?: ?LinksRegistry,
}

export class LinksRegistry {
  links: Array<{
    href: string,
  }> = []

  linkTags(): React.Node {
    return (
      <React.Fragment>
        {this.links.map((props, index) => (
          <link key={index} {...props} />
        ))}
      </React.Fragment>
    )
  }
}

export const LinksRegistryContext: React.Context<?LinksRegistry> = React.createContext(
  null
)

class LinkLoader extends React.PureComponent<InnerProps, State> {
  mounted: boolean = false
  promise: Promise<void> = loadLink(this.props)
  state = getState(this.props)

  static propTypes = {
    href: PropTypes.string.isRequired,
    onLoad: PropTypes.func,
    onError: PropTypes.func,
    children: PropTypes.func,
  }

  componentDidMount() {
    this.mounted = true
    this.listenTo(this.promise)
  }

  componentWillUnmount() {
    this.mounted = false
  }

  componentDidUpdate() {
    const promise = loadLink(this.props)
    if (this.promise !== promise) {
      this.setState(getState(this.props))
      this.promise = promise
      this.listenTo(promise)
    }
  }

  listenTo(promise: Promise<any>) {
    const { props } = this
    const { onLoad, onError } = props
    promise.then(
      () => {
        if (!this.mounted || this.promise !== promise) return
        if (onLoad) onLoad()
        this.setState(getState(props))
      },
      (error: Error) => {
        if (!this.mounted || this.promise !== promise) return
        if (onError) onError(error)
        this.setState(getState(props))
      }
    )
  }

  render(): React.Node {
    const { children } = this.props
    if (children) {
      const result = children({ ...this.state })
      return result == null ? null : result
    }
    return null
  }
}

const ConnectedLinksLoader = (props: Props) => (
  <LinksRegistryContext.Consumer>
    {linksRegistry => <LinkLoader {...props} linksRegistry={linksRegistry} />}
  </LinksRegistryContext.Consumer>
)
export default ConnectedLinksLoader
