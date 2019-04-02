// @flow

/* eslint-env browser */

import { describe, it, afterEach } from 'mocha'
import * as React from 'react'
import { mount } from 'enzyme'
import { expect } from 'chai'
import sinon from 'sinon'

import LinkLoader, { LinksRegistryContext, LinksRegistry } from '../src'
import loadLink from '../src/loadLink'

describe('LinkLoader', () => {
  afterEach(() => {
    document.querySelectorAll('link').forEach(link => link.remove())
  })
  it('load works', async function(): Promise<void> {
    this.timeout(10000)
    const render = sinon.spy(() => 'hello')
    let onLoad, onError
    const promise = new Promise((resolve: any, reject: any) => {
      onLoad = resolve
      onError = reject
    })
    const comp = mount(
      <LinkLoader href="foo" id="linkId" onLoad={onLoad} onError={onError}>
        {render}
      </LinkLoader>
    )
    expect(comp.text()).to.equal('hello')
    expect(render.lastCall.lastArg).to.containSubset({
      loading: true,
      loaded: false,
      error: undefined,
    })
    const link = document.getElementById('linkId')
    if (!link) throw new Error('failed to get link')
    ;(link: any).onload()
    await promise
    expect(render.lastCall.lastArg).to.containSubset({
      loading: false,
      loaded: true,
      error: null,
    })
  })
  it('error works', async function(): Promise<void> {
    this.timeout(10000)
    const render = sinon.spy(() => 'hello')
    let onLoad, onError
    const promise = new Promise((resolve: any, reject: any) => {
      onLoad = resolve
      onError = reject
    })
    const comp = mount(
      <LinkLoader href="bar" id="linkId" onLoad={onLoad} onError={onError}>
        {render}
      </LinkLoader>
    )
    expect(comp.text()).to.equal('hello')
    expect(render.lastCall.lastArg).to.containSubset({
      loading: true,
      loaded: false,
      error: undefined,
    })
    const link = document.getElementById('linkId')
    if (!link) throw new Error('failed to get link')
    ;(link: any).onerror()
    await promise.catch(() => {})
    const arg1 = render.lastCall.lastArg
    expect(arg1.loading).to.be.false
    expect(arg1.loaded).to.be.false
    expect(arg1.error).to.be.an.instanceOf(Error)
  })
  it(`doesn't create a duplicate link`, async function(): Promise<void> {
    this.timeout(10000)
    const preexisting = document.createElement('link')
    preexisting.href = 'baz'
    ;(document.body: any).appendChild(preexisting)

    const render = sinon.spy(() => 'hello')
    let onLoad, onError
    const promise = new Promise((resolve: any, reject: any) => {
      onLoad = resolve
      onError = reject
    })
    const comp = mount(
      <LinkLoader href="baz" id="linkId" onLoad={onLoad} onError={onError}>
        {render}
      </LinkLoader>
    )
    expect(comp.text()).to.equal('hello')
    expect(render.lastCall.lastArg).to.containSubset({
      loading: true,
      loaded: false,
      error: undefined,
    })
    const link = document.getElementById('linkId')
    if (link) throw new Error('duplicate link found')
    await promise.catch(() => {})
    const arg1 = render.lastCall.lastArg
    expect(arg1.loading).to.be.false
    expect(arg1.loaded).to.be.true
    expect(arg1.error).to.be.null
  })
  it(`doesn't call onLoad after href changes`, async function(): Promise<void> {
    this.timeout(10000)

    const render = sinon.spy(() => 'hello')
    const oldOnLoad = sinon.spy()
    let onLoad, onError
    const promise = new Promise((resolve: any, reject: any) => {
      onLoad = resolve
      onError = reject
    })
    const comp = mount(
      <LinkLoader href="qux" id="linkId1" onLoad={oldOnLoad}>
        {render}
      </LinkLoader>
    )
    comp
      .setProps(
        (
          <LinkLoader
            href="qlomb"
            id="linkId2"
            onLoad={onLoad}
            onError={onError}
          >
            {render}
          </LinkLoader>
        ).props
      )
      .update()
    expect(render.lastCall.lastArg).to.containSubset({
      loading: true,
      loaded: false,
      error: undefined,
    })
    const link1 = document.getElementById('linkId1')
    if (!link1) throw new Error('missing link 1')
    ;(link1: any).onload()
    const link2 = document.getElementById('linkId2')
    if (!link2) throw new Error('missing link 2')
    ;(link2: any).onload()
    await promise.catch(() => {})
    expect(oldOnLoad.called).to.be.false
    expect(render.lastCall.lastArg).to.containSubset({
      loading: false,
      loaded: true,
      error: null,
    })
  })
  it(`doesn't call onError after href changes`, async function(): Promise<void> {
    this.timeout(10000)

    const render = sinon.spy(() => 'hello')
    const oldOnError = sinon.spy()
    let onLoad, onError
    const promise = new Promise((resolve: any, reject: any) => {
      onLoad = resolve
      onError = reject
    })
    const comp = mount(
      <LinkLoader href="quxage" id="linkId1" onError={oldOnError}>
        {render}
      </LinkLoader>
    )
    comp
      .setProps(
        (
          <LinkLoader
            href="qlombage"
            id="linkId2"
            onLoad={onLoad}
            onError={onError}
          >
            {render}
          </LinkLoader>
        ).props
      )
      .update()
    expect(render.lastCall.lastArg).to.containSubset({
      loading: true,
      loaded: false,
      error: undefined,
    })
    const link1 = document.getElementById('linkId1')
    if (!link1) throw new Error('missing link 1')
    ;(link1: any).onerror()
    const link2 = document.getElementById('linkId2')
    if (!link2) throw new Error('missing link 2')
    ;(link2: any).onload()
    await promise.catch(() => {})
    expect(oldOnError.called).to.be.false
    expect(render.lastCall.lastArg).to.containSubset({
      loading: false,
      loaded: true,
      error: null,
    })
  })
  it(`doesn't call onLoad after unmount`, async function(): Promise<void> {
    this.timeout(10000)

    const render = sinon.spy(() => 'hello')
    const oldOnLoad = sinon.spy()
    const comp = mount(
      <LinkLoader href="blah" id="linkId" onLoad={oldOnLoad}>
        {render}
      </LinkLoader>
    )
    comp.unmount()
    const link = document.getElementById('linkId')
    if (!link) throw new Error('missing link')
    ;(link: any).onload()
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(oldOnLoad.called).to.be.false
  })
  it(`doesn't call onError after unmount`, async function(): Promise<void> {
    this.timeout(10000)

    const render = sinon.spy(() => 'hello')
    const oldOnError = sinon.spy()
    const comp = mount(
      <LinkLoader href="blag" id="linkId" onError={oldOnError}>
        {render}
      </LinkLoader>
    )
    comp.unmount()
    const link = document.getElementById('linkId')
    if (!link) throw new Error('missing link')
    ;(link: any).onerror(new Error())
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(oldOnError.called).to.be.false
  })
})
describe(`loadLink`, function() {
  it(`errors if document is not defined`, async function(): Promise<void> {
    const prevDocument = document
    document = undefined // eslint-disable-line no-global-assign
    try {
      let error: ?Error
      await loadLink({ href: 'documentundefined' }).catch(err => (error = err))
      expect(error).to.exist
    } finally {
      document = prevDocument // eslint-disable-line no-global-assign
    }
  })
})
describe(`SSR`, function() {
  it(`works`, function() {
    this.timeout(10000)
    const render = sinon.spy(() => 'hello')
    const registry = new LinksRegistry()
    mount(
      <LinksRegistryContext.Provider value={registry}>
        <LinkLoader href="foo" id="linkId">
          {render}
        </LinkLoader>
      </LinksRegistryContext.Provider>
    )
    const comp = mount(registry.linkTags())

    expect(render.lastCall.lastArg).to.containSubset({
      loading: true,
      loaded: false,
      error: null,
    })
    expect(comp.find('link').prop('href')).to.equal('foo')
  })
})
