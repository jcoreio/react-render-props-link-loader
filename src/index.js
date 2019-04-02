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

export const LinksRegistryContext: React.Context<?LinksRegistry> = React.createContext(
  null
)

export default class LinkLoader extends React.PureComponent<Props, State> {
  state = getState(this.props)
  promise: ?Promise<void>

  static propTypes = {
    href: PropTypes.string.isRequired,
    onLoad: PropTypes.func,
    onError: PropTypes.func,
    children: PropTypes.func,
  }

  load() {
    const { props } = this
    const {
      onLoad,
      onError,
      children, // eslint-disable-line no-unused-vars
      ...loadProps
    } = props
    const promise = loadLink(loadProps)
    if (this.promise !== promise) {
      this.promise = promise
      this.setState(getState(props))
      promise.then(
        () => {
          if (this.promise !== promise) return
          if (onLoad) onLoad()
          this.setState(getState(props))
        },
        (error: Error) => {
          if (this.promise !== promise) return
          if (onError) onError(error)
          this.setState(getState(props))
        }
      )
    }
  }

  componentDidMount() {
    this.load()
  }

  componentDidUpdate() {
    this.load()
  }

  componentWillUnmount() {
    this.promise = null
  }

  render(): React.Node {
    const {
      children,
      /* eslint-disable no-unused-vars */
      onLoad,
      onError,
      /* eslint-enable no-unused-vars */
      ...props
    } = this.props
    return (
      <LinksRegistryContext.Consumer>
        {(context: ?LinksRegistry) => {
          if (context) {
            context.links.push(props)
            if (!children) return <React.Fragment />
            const result = children({
              loading: true,
              loaded: false,
              error: null,
              promise: new Promise(() => {}),
            })
            return result == null ? null : result
          }
          if (children) {
            const result = children({ ...this.state })
            return result == null ? null : result
          }
          return null
        }}
      </LinksRegistryContext.Consumer>
    )
  }
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
