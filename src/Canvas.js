import React from 'react'

import ReactDOM from 'react-dom'
// It is not a bad idea to include react-dom/server in the bundle.
// It is only 620 bytes, see https://gist.github.com/irae/2026a9655ca5ee8cd9e821c63435de1e
import reactDOMServer from 'react-dom/server'
import EventEmitter from 'events'

import bindme from 'bindme'
import no from 'not-defined'
import svgx from 'svgx'

import Frame from './components/Frame'
import randomString from './utils/randomString'
import {
  FlowView,
  Id,
  NodeIdAndPosition,
  Pin,
  SerializedLink,
  SerializedNode
} from './components/types'

// TODO find a better way to generate ids.
var idLength = 3
var defaultItem = Frame.defaultProps.item

class Canvas extends EventEmitter {
  constructor (containerId, item) {
    bindme(super(),
      'emitCreateInputPin',
      'emitCreateLink',
      'emitCreateNode',
      'emitCreateOutputPin',
      'emitDeleteInputPin',
      'emitDeleteLink',
      'emitDeleteNode',
      'emitDeleteOutputPin'
    )

    this.view = Frame.defaultProps.view

    if (no(item)) item = defaultItem
    if (no(item.link)) item.link = defaultItem.link
    if (no(item.link.DefaultLink)) item.link = defaultItem.link.DefaultLink
    if (no(item.node)) item.node = defaultItem.node
    if (no(item.node.DefaultNode)) item.node.DefaultNode = defaultItem.node.DefaultNode
    if (no(item.nodeList)) item.nodeList = defaultItem.nodeList
    if (no(item.util)) item.util = defaultItem.util

    this.item = item

    // Check that containerId is a string.
    if (typeof containerId !== 'string') {
      throw new TypeError('containerId must be a string', containerId)
    }

    // If we are in browser context, get the document element containing
    // the canvas or create it.
    //
    // Cannot use `if (document)` or `if(no(document))` otherwise
    // test/serverside/works.js will fail.
    if (typeof document !== 'undefined') {
      var container = document.getElementById(containerId)

      if (container === null) {
        container = document.createElement('div')
        container.id = containerId

        container.setAttribute('style', 'display: inline-block; height: 400px; width: 100%;')

        document.body.appendChild(container)
      }

      this.container = container
    } else {
      this.container = null
    }
  }

  emitCreateInputPin (nodeIdAndPosition: NodeIdAndPosition, pin: Pin) {
    this.emit('createInputPin', nodeIdAndPosition, pin)
  }

  emitCreateLink (link: SerializedLink, id: Id) {
    this.emit('createLink', link, id)
  }

  emitCreateNode (node: SerializedNode, id: Id) {
    this.emit('createNode', node, id)
  }

  emitCreateOutputPin (nodeIdAndPosition: NodeIdAndPosition, pin: Pin) {
    this.emit('createOutputPin', nodeIdAndPosition, pin)
  }

  emitDeleteInputPin (nodeIdAndPosition: NodeIdAndPosition) {
    this.emit('deleteInputPin', nodeIdAndPosition)
  }

  emitDeleteLink (id: Id) {
    this.emit('deleteLink', id)
  }

  emitDeleteNode (id: Id) {
    this.emit('deleteNode', id)
  }

  emitDeleteOutputPin (nodeIdAndPosition: NodeIdAndPosition) {
    this.emit('deleteOutputPin', nodeIdAndPosition)
  }

  getView () {
    return Object.assign({}, this.view)
  }

  setView ({node, link}): FlowView {
    let view = this.getView()

    if (link) {
      Object.keys(link).forEack((id) => {
        view.link[id] = link[id]
      })
    }

    if (node) {
      Object.keys(node).forEack((id) => {
        view.node[id] = node[id]
      })
    }

    this.view = Object.assign({}, view)
  }

  /**
   * Render to SVG.
   *
   * @param {Object} view
   * @param {Object} [model]
   * @param {Function} [callback] run server side
   */

  render (view, model, callback) {
    const container = this.container
    const item = this.item

    var height
    var width

     // Get height and width from container, if any.
    if (container) {
      var border = 1 // TODO could be configurable in style prop
      var rect = container.getBoundingClientRect()

      height = rect.height - (2 * border)
      width = rect.width - (2 * border)
    }

    if (no(view.height)) view.height = height
    if (no(view.link)) view.link = {}
    if (no(view.node)) view.node = {}
    if (no(view.width)) view.width = width

    var createInputPin = (nodeId, pin) => {
      var ins = view.node[nodeId].ins

      if (no(ins)) view.node[nodeId].ins = ins = []

      var position = ins.length

      if (no(pin)) pin = `in${position}`

      this.emitCreateInputPin([nodeId, position], pin)

      view.node[nodeId].ins.push(pin)
    }

    var createOutputPin = (nodeId, pin) => {
      var outs = view.node[nodeId].outs

      if (no(outs)) view.node[nodeId].outs = outs = []

      var position = outs.length

      if (no(pin)) pin = `out${position}`

      this.emitCreateOutputPin([nodeId, position], pin)

      view.node[nodeId].outs.push(pin)
    }

    function generateId () {
      var id = randomString(idLength)

      return (view.link[id] || view.node[id]) ? generateId() : id
    }

    var createLink = (link) => {
      var from = link.from
      var to = link.to

      var id = generateId()

       // Do not fire createLink event if it is a dragging link.
      if (no(to)) {
        view.link[id] = { from }
      } else {
        view.link[id] = { from, to }

        this.emitCreateLink({ from, to }, id)
      }

      return id
    }

    var createNode = (node) => {
      var id = generateId()

      view.node[id] = node

      this.emitCreateNode(node, id)

      return id
    }

    var deleteLink = (id) => {
      this.emitDeleteLink(id)

      delete view.link[id]
    }

    var deleteNode = (id) => {
       // delete links connected to given node.
      Object.keys(view.link).forEach((linkId) => {
        var from = view.link[linkId].from
        var to = view.link[linkId].to

        if (from && from[0] === id) {
          deleteLink(linkId)
        }

        if (to && to[0] === id) {
          deleteLink(linkId)
        }
      })

      delete view.node[id]

      this.emitDeleteNode(id)
    }

    var dragItems = (dragginDelta, draggedItems) => {
      Object.keys(view.node)
       .filter((id) => (draggedItems.indexOf(id) > -1))
       .forEach((id) => {
         view.node[id].x += dragginDelta.x
         view.node[id].y += dragginDelta.y
       })
    }

    var deleteInputPin = (nodeId, position) => {
      var ins = view.node[nodeId].ins

      if (no(ins)) return
      if (ins.length === 0) return

      if (no(position)) position = ins.length - 1

       // Look for connected links and delete them.

      Object.keys(view.link).forEach((id) => {
        var to = view.link[id].to

        if (no(to)) return

        if ((to[0] === nodeId) && (to[1] === position)) {
          deleteLink(id)
        }
      })

      this.emitDeleteInputPin([nodeId, position])

      view.node[nodeId].ins.splice(position, 1)
    }

    var endDragging = (selectNodes) => {
      var nodesCoordinates = {}

      selectNodes.forEach((id) => {
        nodesCoordinates.id = {}
        nodesCoordinates.id.x = view.node[id].x
        nodesCoordinates.id.y = view.node[id].y
      })

      this.emit('endDragging', nodesCoordinates)
    }

    var deleteOutputPin = (nodeId, position) => {
      var outs = view.node[nodeId].outs

      if (no(outs)) return
      if (outs.length === 0) return

      if (no(position)) position = outs.length - 1

       // Look for connected links and delete them.

      Object.keys(view.link).forEach((id) => {
        var from = view.link[id].from

        if (no(from)) return

        if ((from[0] === nodeId) && (from[1] === position)) {
          deleteLink(id)
        }
      })

      this.emitDeleteOutputPin([nodeId, position])

      view.node[nodeId].outs.splice(position, 1)
    }

     // TODO this is not used buy now.
    var renameNode = (nodeId, text) => {
      view.node[nodeId].text = text
    }

    var updateLink = (id, link) => {
      var to = link.to
      var from = link.from

       // Trigger a createLink event if it is a connected link.
      if (no(from)) {
        view.link[id].to = to

        this.emit('createLink', view.link[id], id)
      }
    }

    var component = (
      <Frame
        createInputPin={createInputPin}
        createOutputPin={createOutputPin}
        createLink={createLink}
        createNode={createNode}
        deleteLink={deleteLink}
        deleteInputPin={deleteInputPin}
        deleteNode={deleteNode}
        deleteOutputPin={deleteOutputPin}
        dragItems={dragItems}
        endDragging={endDragging}
        emitCreateInputPin={this.emitCreateInputPin}
        emitCreateLink={this.emitCreateLink}
        emitCreateNode={this.emitCreateNode}
        emitCreateOutputPin={this.emitCreateOutputPin}
        emitDeleteInputPin={this.emitDeleteInputPin}
        emitDeleteLink={this.emitDeleteLink}
        emitDeleteNode={this.emitDeleteNode}
        emitDeleteOutputPin={this.emitDeleteOutputPin}
        item={item}
        model={model}
        nodeList={item.nodeList}
        renameNode={renameNode}
        updateLink={updateLink}
        view={view}
       />
     )

    if (container) {
       // Client side rendering.
      ReactDOM.render(component, container)
    } else {
       // Server side rendering.

      var opts = { doctype: true, xmlns: true }

      var jsx = (
        <Frame
          item={item}
          view={view}
         />
       )

      var outputSVG = svgx(reactDOMServer.renderToStaticMarkup)(jsx, opts)

      if (typeof callback === 'function') {
        callback(null, outputSVG)
      }
    }
  }
}

module.exports = exports.default = Canvas
