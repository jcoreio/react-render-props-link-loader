# react-render-props-link-loader

[![CircleCI](https://circleci.com/gh/jcoreio/react-render-props-link-loader.svg?style=svg)](https://circleci.com/gh/jcoreio/react-render-props-link-loader)
[![Coverage Status](https://codecov.io/gh/jcoreio/react-render-props-link-loader/branch/master/graph/badge.svg)](https://codecov.io/gh/jcoreio/react-render-props-link-loader)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![npm version](https://badge.fury.io/js/react-library-skeleton.svg)](https://badge.fury.io/js/react-library-skeleton)

an easier to use dynamic link loader with a [render prop](https://reactjs.org/docs/render-props.html)

This is useful if you want to wait to load web fonts or other static CSS until
the user navigates to a view that uses it. When you mount a `<LinkLoader>`
component, it will create the link tag you've requested.

`<LinkLoader>` doesn't load a given link URL more than once, even if there
is a pre-existing `<link>` tag for that URL that it didn't create. If the `href`
prop changes, it will load that new URL.

# Version notes

- supports React 15 or 16
- if building for legacy browsers with a bundler like Webpack that supports the
  `module` field of `package.json`, you will probably need to add a rule to
  transpile this package.

# Installation

```sh
npm install --save react-render-props-link-loader
```

# Example

```js
import * as React from 'react'
import LinkLoader from 'react-render-props-link-loader'

import SomeView from './SomeView'

export const SomeViewContainer = props => (
  <LinkLoader
    href="https://fonts.googleapis.com/css?family=Rubik:300,400,500"
    rel="stylesheet"
    onLoad={() => console.log('loaded fonts!')}
    onError={error => console.error('failed to load fonts', error.stack)}
  >
    {({ loading, error }) => {
      if (loading) return <h3>Loading fonts...</h3>
      if (error) return <h3>Failed to load fonts: {error.message}</h3>
      return <SomeView {...props} />
    }}
  </LinkLoader>
)
```

# API

## `LinkLoader`

```js
import LinkLoader from 'react-render-props-link-loader'
```

### `href` (**required** `string`)

The link URL.

### `onLoad` (`?() => any`)

A callback that `LinkLoader` will call once the link has been loaded

### `onError` (`?(error: Error) => any`)

A callback that `LinkLoader` will call if there was an error loading the
link

### `children` (`?(state: State) => ?React.Node`)

The render function. It will be called with an object having the following
props, and may return your desired content to display:

```js
{
  loading: boolean,
  loaded: boolean,
  error: ?Error,
  promise: ?Promise<any>,
}
```

## Server-Side Rendering

```js
import {
  LinksRegistry,
  LinksRegistryContext,
} from 'react-render-props-link-loader'
```

On the server, create an instance of `LinksRegistry` and put it on the app's
context:

```js
const registry = new LinksRegistry()

const body = ReactDOM.renderToString(
  <LinksRegistryContext.Provider value={registry}>
    <App />
  </LinksRegistryContext.Provider>
)
```

Then render `registry.linkTags()` in your head element:

```js
const html = (
  <html className="default">
    <head>
      ...
      {registry.linkTags()}
    </head>
    ...
  </html>
)
```
